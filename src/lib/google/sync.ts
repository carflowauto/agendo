/**
 * Synchro Google Agenda, lancée par le Cron Trigger du worker (toutes les 5 min) :
 * 1. file Sheensy -> Google : un événement par rendez-vous confirmé (5 tentatives max) ;
 * 2. Google -> Sheensy : créneaux occupés (freeBusy, 60 jours) toutes les 10 min ou à la demande.
 * Aucune clé service_role : tout passe par des fonctions SQL protégées par EMAIL_QUEUE_SECRET.
 * Sans GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET, rien n'est fait.
 */
import { rpc } from "../email/dispatch";
import { BUSY_WINDOW_DAYS, normalizeBusy } from "./busy";
import { deleteEvent, freeBusy, GoogleApiError, upsertEvent } from "./calendar";
import { googleConfigured, siteUrlFrom, type GoogleEnv } from "./config";
import { decryptToken } from "./crypto";
import { decideEventAction, type GoogleEventJob } from "./events";
import { GoogleAuthError, refreshAccessToken } from "./oauth";

export type GoogleSyncResult = {
  skipped?: string;
  events: { claimed: number; done: number; failed: number };
  busy: { accounts: number; ok: number; failed: number };
  error?: string;
};

type TokenCache = Map<string, Promise<string>>;

function accessTokenFor(env: GoogleEnv, cache: TokenCache, profileId: string, sealed: string) {
  let pending = cache.get(profileId);
  if (!pending) {
    pending = decryptToken(sealed, env.GOOGLE_TOKEN_KEY!, profileId).then((rt) => refreshAccessToken(env, rt));
    cache.set(profileId, pending);
  }
  return pending;
}

function describe(error: unknown) {
  const revoked = error instanceof GoogleAuthError && error.revoked;
  const permanent = revoked || (error instanceof GoogleApiError && error.permanent);
  return { message: error instanceof Error ? error.message : String(error), revoked, permanent };
}

export async function runGoogleEventQueue(env: GoogleEnv, cache: TokenCache = new Map(), limit = 20) {
  const jobs = await rpc<GoogleEventJob[]>(env, "google_event_claim", { p_secret: env.EMAIL_QUEUE_SECRET, p_limit: limit });
  const siteUrl = siteUrlFrom(env);
  let done = 0;
  let failed = 0;
  for (const job of jobs ?? []) {
    let eventId: string | null = null;
    let problem: ReturnType<typeof describe> | null = null;
    try {
      const token = await accessTokenFor(env, cache, job.profile_id, job.refresh_token_enc);
      const action = decideEventAction(job, siteUrl);
      if (action.kind === "delete") {
        await deleteEvent(token, action.eventId);
        eventId = null;
      } else {
        eventId = await upsertEvent(token, action.eventId, action.body, Boolean(job.google_event_id));
      }
    } catch (error) {
      problem = describe(error);
    }
    if (problem) failed += 1;
    else done += 1;
    await rpc(env, "google_event_complete", {
      p_secret: env.EMAIL_QUEUE_SECRET,
      p_appointment_id: job.appointment_id,
      p_version: job.version,
      p_ok: !problem,
      p_google_event_id: problem ? null : eventId,
      p_error: problem?.message ?? null,
      p_permanent: problem?.permanent ?? false,
      p_revoked: problem?.revoked ?? false,
    });
  }
  return { claimed: jobs?.length ?? 0, done, failed };
}

export async function runGoogleBusySync(
  env: GoogleEnv,
  options: { profileId?: string; cache?: TokenCache; now?: Date; limit?: number } = {},
) {
  const cache = options.cache ?? new Map();
  const accounts = await rpc<{ profile_id: string; refresh_token_enc: string }[]>(env, "google_busy_claim", {
    p_secret: env.EMAIL_QUEUE_SECRET,
    p_limit: options.limit ?? 10,
    p_profile_id: options.profileId ?? null,
  });
  let ok = 0;
  let failed = 0;
  for (const account of accounts ?? []) {
    const from = options.now ?? new Date();
    const to = new Date(from.getTime() + BUSY_WINDOW_DAYS * 86_400_000);
    try {
      const token = await accessTokenFor(env, cache, account.profile_id, account.refresh_token_enc);
      const busy = normalizeBusy(await freeBusy(token, from, to), from, to);
      await rpc(env, "google_busy_store", { p_secret: env.EMAIL_QUEUE_SECRET, p_profile_id: account.profile_id, p_busy: busy });
      ok += 1;
    } catch (error) {
      const problem = describe(error);
      failed += 1;
      await rpc(env, "google_busy_store", {
        p_secret: env.EMAIL_QUEUE_SECRET,
        p_profile_id: account.profile_id,
        p_busy: [],
        p_error: problem.message,
        p_revoked: problem.revoked,
      });
    }
  }
  return { accounts: accounts?.length ?? 0, ok, failed };
}

export async function runGoogleSync(env: GoogleEnv): Promise<GoogleSyncResult> {
  const empty = { events: { claimed: 0, done: 0, failed: 0 }, busy: { accounts: 0, ok: 0, failed: 0 } };
  if (!googleConfigured(env)) return { ...empty, skipped: "Google non configuré" };
  const cache: TokenCache = new Map();
  const result: GoogleSyncResult = { ...empty };
  const errors: string[] = [];
  try {
    result.events = await runGoogleEventQueue(env, cache);
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  try {
    result.busy = await runGoogleBusySync(env, { cache });
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  if (errors.length) result.error = errors.join(" | ");
  return result;
}
