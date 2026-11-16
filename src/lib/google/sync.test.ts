import assert from "node:assert/strict";
import test from "node:test";
import { buildAuthUrl, emailFromIdToken, hasRequiredScopes } from "./oauth";
import { googleConfigured, type GoogleEnv } from "./config";
import { encryptToken } from "./crypto";
import { eventIdFor } from "./events";
import { runGoogleBusySync, runGoogleEventQueue, runGoogleSync } from "./sync";

const key = Buffer.alloc(32, 5).toString("base64");
const env: GoogleEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://db.test",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "anon",
  NEXT_PUBLIC_SITE_URL: "https://sheensy.com",
  EMAIL_QUEUE_SECRET: "queue-secret",
  GOOGLE_CLIENT_ID: "client.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: "client-secret",
  GOOGLE_TOKEN_KEY: key,
};

type Call = { url: string; method: string; body: unknown };

function mockFetch(handler: (call: Call) => { status?: number; json?: unknown }) {
  const calls: Call[] = [];
  const original = globalThis.fetch;
  globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const raw = init?.body ? String(init.body) : "";
    let body: unknown = raw;
    try {
      body = raw ? JSON.parse(raw) : null;
    } catch {
      body = Object.fromEntries(new URLSearchParams(raw));
    }
    const call = { url, method: init?.method ?? "GET", body };
    calls.push(call);
    const r = handler(call);
    return new Response(r.json === undefined ? "" : JSON.stringify(r.json), { status: r.status ?? 200 });
  }) as typeof fetch;
  return { calls, restore: () => (globalThis.fetch = original) };
}

test("configuration : dormante sans identifiants OAuth", () => {
  assert.equal(googleConfigured(env), true);
  assert.equal(googleConfigured({ ...env, GOOGLE_CLIENT_ID: "" }), false);
  assert.equal(googleConfigured({ ...env, GOOGLE_CLIENT_SECRET: undefined }), false);
  assert.equal(googleConfigured({ ...env, GOOGLE_TOKEN_KEY: "trop-court" }), false);
});

test("URL d'autorisation : hors ligne, consentement, PKCE, scopes minimaux", () => {
  const url = new URL(buildAuthUrl(env, "etat", "defi"));
  assert.equal(url.origin + url.pathname, "https://accounts.google.com/o/oauth2/v2/auth");
  assert.equal(url.searchParams.get("redirect_uri"), "https://sheensy.com/api/google/callback");
  assert.equal(url.searchParams.get("access_type"), "offline");
  assert.equal(url.searchParams.get("prompt"), "consent");
  assert.equal(url.searchParams.get("state"), "etat");
  assert.equal(url.searchParams.get("code_challenge_method"), "S256");
  assert.equal(
    url.searchParams.get("scope"),
    "openid email https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.freebusy",
  );
  assert.equal(hasRequiredScopes("openid https://www.googleapis.com/auth/calendar.events"), false);
  assert.equal(
    hasRequiredScopes("https://www.googleapis.com/auth/calendar.freebusy openid https://www.googleapis.com/auth/calendar.events"),
    true,
  );
  const payload = Buffer.from(JSON.stringify({ email: "pro@gmail.com" })).toString("base64url");
  assert.equal(emailFromIdToken(`x.${payload}.y`), "pro@gmail.com");
  assert.equal(emailFromIdToken("illisible"), null);
});

test("runGoogleSync ne fait aucun appel sans configuration", async () => {
  const m = mockFetch(() => ({ status: 500 }));
  try {
    const result = await runGoogleSync({ ...env, GOOGLE_CLIENT_ID: undefined });
    assert.equal(result.skipped, "Google non configuré");
    assert.equal(m.calls.length, 0);
  } finally {
    m.restore();
  }
});

test("file d'événements : création, suppression, erreur réessayable et jeton révoqué", async () => {
  const sealedA = await encryptToken("refresh-A", key, "pA");
  const sealedB = await encryptToken("refresh-B", key, "pB");
  const appt = {
    status: "confirmed",
    source: "online",
    starts_at: "2026-11-20T09:00:00Z",
    ends_at: "2026-11-20T10:00:00Z",
    service_name: "Pose gel",
    client_name: "Léa",
    client_phone: null,
    notes: null,
  };
  const jobs = [
    { appointment_id: "aaaaaaaa-0000-0000-0000-000000000001", profile_id: "pA", version: 3, refresh_token_enc: sealedA, google_event_id: null, timezone: "Europe/Paris", salon_name: "S", address: null, appointment: appt },
    { appointment_id: "aaaaaaaa-0000-0000-0000-000000000002", profile_id: "pA", version: 1, refresh_token_enc: sealedA, google_event_id: "shold", timezone: "Europe/Paris", salon_name: "S", address: null, appointment: null },
    { appointment_id: "aaaaaaaa-0000-0000-0000-000000000003", profile_id: "pA", version: 1, refresh_token_enc: sealedA, google_event_id: null, timezone: "Europe/Paris", salon_name: "S", address: null, appointment: { ...appt, starts_at: "2026-11-21T09:00:00Z", ends_at: "2026-11-21T10:00:00Z" } },
    { appointment_id: "aaaaaaaa-0000-0000-0000-000000000004", profile_id: "pB", version: 1, refresh_token_enc: sealedB, google_event_id: null, timezone: "Europe/Paris", salon_name: "S", address: null, appointment: appt },
  ];
  let inserts = 0;
  const m = mockFetch(({ url, method, body }) => {
    if (url.endsWith("/rpc/google_event_claim")) return { json: jobs };
    if (url.endsWith("/rpc/google_event_complete")) return { json: "done" };
    if (url === "https://oauth2.googleapis.com/token") {
      const b = body as Record<string, string>;
      return b.refresh_token === "refresh-B" ? { status: 400, json: { error: "invalid_grant" } } : { json: { access_token: "at-A" } };
    }
    if (method === "POST" && url.endsWith("/calendars/primary/events")) {
      inserts += 1;
      return inserts === 1 ? { json: { id: (body as { id: string }).id } } : { status: 503, json: { error: { message: "busy" } } };
    }
    if (method === "DELETE") return { status: 410 };
    return { status: 500 };
  });
  try {
    const result = await runGoogleEventQueue(env);
    assert.deepEqual(result, { claimed: 4, done: 2, failed: 2 });
    const tokenCalls = m.calls.filter((c) => c.url.includes("oauth2.googleapis.com/token"));
    assert.equal(tokenCalls.length, 2, "un seul rafraîchissement par pro");
    const completes = m.calls.filter((c) => c.url.endsWith("/rpc/google_event_complete")).map((c) => c.body as Record<string, unknown>);
    assert.equal(completes[0].p_ok, true);
    assert.equal(completes[0].p_version, 3);
    assert.equal(completes[0].p_google_event_id, eventIdFor(jobs[0].appointment_id));
    assert.equal(completes[0].p_secret, "queue-secret");
    assert.equal(completes[1].p_ok, true);
    assert.equal(completes[1].p_google_event_id, null);
    assert.equal(m.calls.find((c) => c.method === "DELETE")?.url.endsWith("/events/shold"), true);
    assert.equal(completes[2].p_ok, false);
    assert.equal(completes[2].p_permanent, false);
    assert.equal(completes[3].p_ok, false);
    assert.equal(completes[3].p_revoked, true);
    assert.equal(completes[3].p_permanent, true);
    const inserted = m.calls.find((c) => c.method === "POST" && c.url.endsWith("/events"))!.body as { transparency: string };
    assert.equal(inserted.transparency, "transparent");
    const auth = m.calls.find((c) => c.url.includes("googleapis.com/calendar"));
    assert.ok(auth);
  } finally {
    m.restore();
  }
});

test("événement existant (409) : mis à jour au lieu d'être dupliqué", async () => {
  const sealed = await encryptToken("refresh-A", key, "pA");
  const job = { appointment_id: "bbbbbbbb-0000-0000-0000-000000000001", profile_id: "pA", version: 1, refresh_token_enc: sealed, google_event_id: null, timezone: null, salon_name: null, address: null, appointment: { status: "confirmed", source: "manual", starts_at: "2026-11-20T09:00:00Z", ends_at: "2026-11-20T10:00:00Z", service_name: null, client_name: null, client_phone: null, notes: null } };
  const m = mockFetch(({ url, method }) => {
    if (url.endsWith("/rpc/google_event_claim")) return { json: [job] };
    if (url.endsWith("/rpc/google_event_complete")) return { json: "done" };
    if (url.includes("oauth2.googleapis.com/token")) return { json: { access_token: "at" } };
    if (method === "POST") return { status: 409, json: { error: { message: "duplicate" } } };
    if (method === "PUT") return { json: { id: eventIdFor(job.appointment_id) } };
    return { status: 500 };
  });
  try {
    assert.deepEqual(await runGoogleEventQueue(env), { claimed: 1, done: 1, failed: 0 });
    assert.equal(m.calls.filter((c) => c.method === "PUT").length, 1);
  } finally {
    m.restore();
  }
});

test("absences : freeBusy sur 60 jours, seules début/fin sont enregistrées", async () => {
  const sealed = await encryptToken("refresh-A", key, "pA");
  const now = new Date("2026-11-16T10:00:00Z");
  const m = mockFetch(({ url }) => {
    if (url.endsWith("/rpc/google_busy_claim")) return { json: [{ profile_id: "pA", refresh_token_enc: sealed }] };
    if (url.endsWith("/rpc/google_busy_store")) return { json: 1 };
    if (url.includes("oauth2.googleapis.com/token")) return { json: { access_token: "at" } };
    if (url.endsWith("/freeBusy"))
      return {
        json: {
          calendars: {
            primary: {
              busy: [
                { start: "2026-11-18T09:00:00Z", end: "2026-11-18T10:00:00Z" },
                { start: "2026-11-18T09:30:00Z", end: "2026-11-18T11:00:00Z" },
              ],
            },
          },
        },
      };
    return { status: 500 };
  });
  try {
    const result = await runGoogleBusySync(env, { profileId: "pA", now });
    assert.deepEqual(result, { accounts: 1, ok: 1, failed: 0 });
    const claim = m.calls.find((c) => c.url.endsWith("/rpc/google_busy_claim"))!.body as Record<string, unknown>;
    assert.equal(claim.p_profile_id, "pA");
    const fb = m.calls.find((c) => c.url.endsWith("/freeBusy"))!.body as { timeMin: string; timeMax: string; items: { id: string }[] };
    assert.equal(fb.timeMin, "2026-11-16T10:00:00.000Z");
    assert.equal(fb.timeMax, "2027-01-15T10:00:00.000Z");
    assert.deepEqual(fb.items, [{ id: "primary" }]);
    const store = m.calls.find((c) => c.url.endsWith("/rpc/google_busy_store"))!.body as Record<string, unknown>;
    assert.deepEqual(store.p_busy, [{ start: "2026-11-18T09:00:00.000Z", end: "2026-11-18T11:00:00.000Z" }]);
  } finally {
    m.restore();
  }
});
