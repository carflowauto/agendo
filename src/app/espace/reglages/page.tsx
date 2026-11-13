import { CopyButton } from "@/components/copy-button";
import { OfferSettings } from "@/components/offer-settings";
import { PasswordForm } from "@/components/auth-forms";
import { ProColumn } from "@/components/pro-shell";
import { Flash, cardClass, fieldClass, labelClass } from "@/components/ui";
import { requestOrigin } from "@/lib/origin";
import { addTimeOff, deleteTimeOff, loadDemo, saveProfile, saveSettings, signOut } from "@/server/actions";
import { requireProfile } from "@/server/profile";
import type { OpeningHour, Service } from "@/lib/types";

export const metadata = { title: "Réglages" };

type TimeOff = { id: string; starts_on: string; ends_on: string; reason: string | null };
type MailRow = { status: string };
type GoogleRow = { status: string; last_error: string | null; last_synced_at: string | null };

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const params = await searchParams;
  const { supabase, profile } = await requireProfile();
  const { data: serviceRows } = await supabase.from("services").select("*").eq("profile_id", profile.id).order("sort_order");
  const { data: hourRows } = await supabase.from("opening_hours").select("*").eq("profile_id", profile.id).order("isodow");
  const { data: periods } = await supabase.from("time_off").select("*").eq("profile_id", profile.id).order("starts_on");
  const { data: mails } = await supabase.from("email_outbox").select("status").eq("profile_id", profile.id);
  const { data: google } = await supabase
    .from("google_calendar_connections")
    .select("status, last_error, last_synced_at")
    .eq("profile_id", profile.id)
    .maybeSingle();
  const origin = await requestOrigin();
  const ical = `${origin}/ical/${profile.ical_token}`;
  const webcal = ical.replace(/^https?:/, "webcal:");
  const counts = { pending: 0, skipped: 0, sent: 0 };
  for (const row of (mails ?? []) as MailRow[]) {
    if (row.status === "pending" || row.status === "skipped" || row.status === "sent") counts[row.status] += 1;
  }
  const googleRow = google as GoogleRow | null;

  return (
    <ProColumn
      header={
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Réglages</h1>
          <p className="text-sm text-slate-500">Prestations, horaires, fiche et synchro</p>
          <Flash ok={params.ok} erreur={params.erreur} />
        </div>
      }
    >
      <div className="space-y-4">
      <form action={saveProfile} className={`${cardClass} space-y-2 p-4`}>
        <input type="hidden" name="retour" value="/espace/reglages" />
        <h2 className="font-bold">Ma fiche</h2>
        <label className={labelClass}>Enseigne<input name="full_name" required defaultValue={profile.full_name} className={fieldClass} /></label>
        <label className={labelClass}>Métier<input name="profession" required defaultValue={profile.profession} className={fieldClass} /></label>
        <label className={labelClass}>Ville<input name="city" defaultValue={profile.city} className={fieldClass} /></label>
        <label className={labelClass}>Téléphone<input name="phone" defaultValue={profile.phone} className={fieldClass} /></label>
        <label className={labelClass}>Adresse<input name="address" defaultValue={profile.address ?? ""} className={fieldClass} /></label>
        <label className={labelClass}>Texte<textarea name="bio" rows={2} defaultValue={profile.bio ?? ""} className="mt-1 w-full rounded-2xl border border-white/80 bg-white px-3 py-2 text-sm" /></label>
        <label className={labelClass}>Adresse de la page<input name="slug" required defaultValue={profile.slug} className={fieldClass} /></label>
        <button className="h-11 w-full rounded-2xl grad text-sm font-semibold text-white">Enregistrer la fiche</button>
      </form>

      <OfferSettings services={(serviceRows ?? []) as Service[]} hours={(hourRows ?? []) as OpeningHour[]} />

      <form action={saveSettings} className={`${cardClass} p-5 grid sm:grid-cols-3 gap-3`}>
        <label className={labelClass}>Délai minimum (heures)<input name="min_notice_hours" type="number" min={0} step="0.5" defaultValue={profile.min_notice_minutes / 60} className={fieldClass} /></label>
        <label className={labelClass}>Rappel (heures avant)<input name="reminder_hours" type="number" min={0} defaultValue={profile.reminder_hours} className={fieldClass} /></label>
        <label className={labelClass}>Remplissage (semaines)<input name="refill_weeks" type="number" min={1} defaultValue={profile.refill_weeks} className={fieldClass} /></label>
        <div className="sm:col-span-3">
          <button className="h-10 px-4 rounded-xl grad text-white text-sm font-semibold">Enregistrer</button>
        </div>
      </form>

      <section className={`${cardClass} p-5`}>
        <h2 className="font-bold">Congés</h2>
        <p className="text-sm text-slate-500 mt-1">Aucun créneau n’est proposé sur ces dates.</p>
        <ul className="mt-3 divide-y divide-slate-100">
          {((periods ?? []) as TimeOff[]).map((period) => (
            <li key={period.id} className="py-2 flex items-center justify-between gap-3 text-sm">
              <span>{period.starts_on} → {period.ends_on}{period.reason ? ` · ${period.reason}` : ""}</span>
              <form action={deleteTimeOff}>
                <input type="hidden" name="id" value={period.id} />
                <button className="text-rose-600 font-semibold">Retirer</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={addTimeOff} className="mt-4 grid sm:grid-cols-4 gap-2 items-end">
          <label className={labelClass}>Du<input type="date" name="starts_on" required className={fieldClass} /></label>
          <label className={labelClass}>Au<input type="date" name="ends_on" required className={fieldClass} /></label>
          <label className={labelClass}>Motif<input name="reason" className={fieldClass} placeholder="Vacances" /></label>
          <button className="h-10 rounded-xl border border-slate-300 text-sm font-semibold">Ajouter</button>
        </form>
      </section>

      <section id="synchro" className={`${cardClass} p-4`}>
        <h2 className="font-bold">Synchronisation</h2>
        <p className="mt-1 text-sm text-slate-500">Google Agenda est préparé, pas encore activé. Statut : {googleRow?.status ?? "not_connected"}.</p>
        {googleRow?.last_error ? <p className="mt-2 text-sm text-rose-700">{googleRow.last_error}</p> : null}
        <a href="/api/google/connect" className="mt-3 inline-flex h-11 items-center rounded-2xl bg-white px-4 text-sm font-semibold">Préparer Google Agenda</a>
        <p className="mt-4 text-sm font-semibold text-slate-900">Calendrier iPhone</p>
        <p className="mt-1 break-all rounded-2xl bg-white px-3 py-2 text-xs">{webcal}</p>
        <div className="mt-2"><CopyButton value={ical} label="Copier le lien iCal" /></div>
      </section>

      <section className={`${cardClass} p-5`}>
        <h2 className="font-bold">Rappels par e-mail</h2>
        <p className="mt-1 text-sm text-slate-500">
          Chaque rendez-vous confirmé crée une confirmation et un rappel dans la file. Sans e-mail de cliente, la ligne est marquée « ignorée ». L’envoi n’est pas encore branché.
        </p>
        <p className="mt-3 text-sm">En attente : {counts.pending} · Ignorés : {counts.skipped} · Envoyés : {counts.sent}</p>
      </section>

      <section className={`${cardClass} p-4`}>
        <h2 className="font-bold">Mot de passe</h2>
        <div className="mt-3"><PasswordForm /></div>
      </section>

      <form action={loadDemo} className={`${cardClass} p-5`}>
        <h2 className="font-bold">Données de démonstration</h2>
        <p className="mt-1 text-sm text-slate-500">Ajoute une journée type (pose, pause, remplissage, dépose) et une relance de remplissage. Les fiches marquées démo sont remplacées.</p>
        <button className="mt-3 h-11 rounded-2xl bg-white px-4 text-sm font-semibold">Charger un exemple</button>
      </form>

      <form action={signOut}>
        <button className="h-11 w-full rounded-2xl text-sm font-semibold text-rose-700">Se déconnecter</button>
      </form>
      </div>
    </ProColumn>
  );
}
