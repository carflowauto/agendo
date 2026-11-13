/**
 * Synchro Google Agenda — structure seulement.
 *
 * Branchement prévu, non activé :
 * 1. `GET /api/google/connect` redirige vers le consentement Google
 *    (scope calendar.events) avec GOOGLE_CLIENT_ID.
 * 2. `GET /api/google/callback` échange le code, enregistre le refresh_token
 *    dans `google_calendar_connections` et passe le statut à `connected`.
 * 3. `pushAppointment` crée ou met à jour l'événement du rendez-vous.
 * 4. `pullBusy` importe les événements personnels comme créneaux `blocked`
 *    pour qu'ils ne soient plus proposés sur la vitrine.
 *
 * Aucun appel Google n'est fait dans cette version.
 */

export type GoogleSyncStatus = "not_connected" | "pending" | "connected" | "error";

export async function pushAppointment(_appointmentId: string): Promise<{ ok: false; reason: string }> {
  return { ok: false, reason: "La synchronisation Google Agenda n'est pas activée." };
}

export async function pullBusy(_profileId: string): Promise<{ ok: false; reason: string }> {
  return { ok: false, reason: "La synchronisation Google Agenda n'est pas activée." };
}
