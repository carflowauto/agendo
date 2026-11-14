/**
 * File d'e-mails de rappel — structure V1.
 *
 * À chaque rendez-vous confirmé, le trigger SQL `enqueue_appointment_emails`
 * insère deux lignes dans `email_outbox` :
 * - confirmation, tout de suite
 * - rappel, `reminder_hours` avant le début
 *
 * Sans e-mail cliente, la ligne est créée avec le statut `skipped`.
 * L'envoi réel (Resend ou autre) n'est pas branché : la route
 * `/api/cron/rappels` se contente de compter les messages `pending`.
 */

export type ReminderKind = "confirmation" | "reminder";

export type ReminderPayload = {
  kind: ReminderKind;
  client_name?: string;
  client_phone?: string;
  service_name?: string;
  starts_at?: string;
  ends_at?: string;
  price_cents?: number;
};

export function reminderSubject(kind: ReminderKind, service?: string) {
  if (kind === "confirmation") return `Sheensy · Confirmation · ${service ?? "votre rendez-vous"}`;
  return `Sheensy · Rappel · ${service ?? "votre rendez-vous"}`;
}

export function resendConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}
