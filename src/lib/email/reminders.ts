/**
 * File d'e-mails transactionnels.
 *
 * Le trigger SQL `enqueue_appointment_emails` insère dans `email_outbox` :
 * - confirmation à la cliente, tout de suite (si elle a laissé un e-mail)
 * - rappel à la cliente, `reminder_hours` avant le début
 * - notification à la pro pour chaque réservation en ligne ou via invitation
 *
 * L'envoi passe par Resend (`src/lib/email/dispatch.ts`), lancé par le Cron
 * Trigger du worker toutes les 5 minutes.
 */
export type { EmailKind as ReminderKind } from "./templates";
