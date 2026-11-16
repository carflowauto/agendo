/** Sheensy -> Google : construction des événements (fonctions pures, testées). */

export type GoogleEventJob = {
  appointment_id: string;
  profile_id: string;
  version: number;
  refresh_token_enc: string;
  google_event_id: string | null;
  timezone: string | null;
  salon_name: string | null;
  address: string | null;
  appointment: null | {
    status: "confirmed" | "cancelled" | "blocked";
    source: string;
    starts_at: string;
    ends_at: string;
    service_name: string | null;
    client_name: string | null;
    client_phone: string | null;
    notes: string | null;
  };
};

/**
 * Identifiant d'événement déterministe (base32hex autorisé par Google : a-v, 0-9).
 * Un même rendez-vous ne peut donc jamais créer deux événements, même après une reprise.
 */
export function eventIdFor(appointmentId: string): string {
  return `sh${appointmentId.toLowerCase().replace(/[^0-9a-f]/g, "")}`;
}

export type EventAction = { kind: "upsert"; eventId: string; body: GoogleEventBody } | { kind: "delete"; eventId: string };

export type GoogleEventBody = {
  id: string;
  summary: string;
  description: string;
  location?: string;
  start: { dateTime: string; timeZone: string };
  end: { dateTime: string; timeZone: string };
  status: "confirmed";
  transparency: "transparent";
  extendedProperties: { private: Record<string, string> };
  source?: { title: string; url: string };
};

/** Seuls les rendez-vous confirmés vont dans Google ; annulés, supprimés ou blocages : on retire l'événement. */
export function decideEventAction(job: GoogleEventJob, siteUrl: string): EventAction {
  const eventId = job.google_event_id || eventIdFor(job.appointment_id);
  const a = job.appointment;
  if (!a || a.status !== "confirmed") return { kind: "delete", eventId };
  return { kind: "upsert", eventId, body: buildEventBody(job, eventId, siteUrl) };
}

export function buildEventBody(job: GoogleEventJob, eventId: string, siteUrl: string): GoogleEventBody {
  const a = job.appointment!;
  const tz = job.timezone || "Europe/Paris";
  const who = a.client_name?.trim() || "Rendez-vous";
  const what = a.service_name?.trim();
  const lines = [
    what ? `Prestation : ${what}` : "",
    a.client_phone ? `Téléphone : ${a.client_phone}` : "",
    a.notes ? `Notes : ${a.notes}` : "",
    "",
    `Rendez-vous Sheensy — ${siteUrl}/espace/agenda`,
  ].filter((line, i, all) => line !== "" || (i > 0 && all[i - 1] !== ""));
  return {
    id: eventId,
    summary: what ? `${who} · ${what}` : who,
    description: lines.join("\n").trim(),
    ...(job.address?.trim() ? { location: job.address.trim() } : {}),
    start: { dateTime: new Date(a.starts_at).toISOString(), timeZone: tz },
    end: { dateTime: new Date(a.ends_at).toISOString(), timeZone: tz },
    status: "confirmed",
    // « Disponible » pour Google : nos propres rendez-vous ne reviennent pas comme absences
    // dans freeBusy (ils bloquent déjà le créneau côté Sheensy).
    transparency: "transparent",
    extendedProperties: { private: { sheensy: "1", sheensyAppointmentId: job.appointment_id } },
    source: { title: "Sheensy", url: `${siteUrl}/espace/agenda` },
  };
}
