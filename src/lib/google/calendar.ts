/** Appels à l'API Google Calendar v3 (calendrier principal de la pro). */
import type { GoogleEventBody } from "./events";
import type { RawBusy } from "./busy";

const API = "https://www.googleapis.com/calendar/v3";

export class GoogleApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
  /** 4xx hors 401/408/409/429 : inutile de réessayer. */
  get permanent() {
    return this.status >= 400 && this.status < 500 && ![401, 408, 409, 429].includes(this.status);
  }
}

async function call(token: string, method: string, path: string, body?: unknown) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    /* réponse non JSON */
  }
  return { status: res.status, ok: res.ok, data, text };
}

function fail(what: string, r: { status: number; data: Record<string, unknown>; text: string }): never {
  const message = (r.data.error as { message?: string } | undefined)?.message ?? r.text.slice(0, 200);
  throw new GoogleApiError(`${what}: HTTP ${r.status} ${message}`, r.status);
}

/** Crée ou met à jour l'événement (id déterministe), et le restaure s'il avait été supprimé. */
export async function upsertEvent(token: string, eventId: string, body: GoogleEventBody, known: boolean): Promise<string> {
  const id = encodeURIComponent(eventId);
  if (known) {
    const r = await call(token, "PUT", `/calendars/primary/events/${id}`, body);
    if (r.ok) return (r.data.id as string) ?? eventId;
    if (r.status !== 404 && r.status !== 410) fail("events.update", r);
  }
  const created = await call(token, "POST", `/calendars/primary/events`, body);
  if (created.ok) return (created.data.id as string) ?? eventId;
  if (created.status === 409) {
    // L'identifiant existe déjà (reprise, ou événement supprimé côté Google) : mise à jour.
    const r = await call(token, "PUT", `/calendars/primary/events/${id}`, body);
    if (r.ok) return (r.data.id as string) ?? eventId;
    fail("events.update", r);
  }
  fail("events.insert", created);
}

export async function deleteEvent(token: string, eventId: string): Promise<void> {
  const r = await call(token, "DELETE", `/calendars/primary/events/${encodeURIComponent(eventId)}`);
  if (r.ok || r.status === 404 || r.status === 410) return;
  fail("events.delete", r);
}

export async function freeBusy(token: string, from: Date, to: Date): Promise<RawBusy[]> {
  const r = await call(token, "POST", "/freeBusy", {
    timeMin: from.toISOString(),
    timeMax: to.toISOString(),
    items: [{ id: "primary" }],
  });
  if (!r.ok) fail("freeBusy", r);
  const calendars = (r.data.calendars ?? {}) as Record<string, { busy?: RawBusy[]; errors?: { reason?: string }[] }>;
  const cal = calendars.primary ?? Object.values(calendars)[0];
  if (!cal) throw new GoogleApiError("freeBusy: calendrier absent", 502);
  if (cal.errors?.length) throw new GoogleApiError(`freeBusy: ${cal.errors.map((e) => e.reason).join(", ")}`, 502);
  return cal.busy ?? [];
}
