import { CopyButton } from "@/components/copy-button";
import { SettingsScreen } from "@/components/settings-screen";
import { cardClass } from "@/components/ui";
import { requestOrigin } from "@/lib/origin";
import { requireProfile } from "@/server/profile";

export const metadata = { title: "Synchronisation" };

export default async function SyncPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const params = await searchParams;
  const { supabase, profile } = await requireProfile();
  const { data } = await supabase.from("google_calendar_connections").select("status, last_error").eq("profile_id", profile.id).maybeSingle();
  const origin = await requestOrigin();
  const ical = `${origin}/ical/${profile.ical_token}`;
  const webcal = ical.replace(/^https?:/, "webcal:");
  const google = data as { status: string; last_error: string | null } | null;
  return (
    <SettingsScreen title="Synchronisation" hint="Google Agenda et l’iPhone" ok={params.ok} erreur={params.erreur}>
      <section className={`${cardClass} space-y-3 p-4`}>
        <h2 className="font-bold">Google Agenda</h2>
        <p className="text-sm text-slate-500">Préparé, pas encore activé. Statut : {google?.status ?? "not_connected"}.</p>
        {google?.last_error ? <p className="text-sm text-rose-700">{google.last_error}</p> : null}
        <a href="/api/google/connect" className="inline-flex h-11 items-center rounded-2xl bg-white px-4 text-sm font-semibold">Préparer la connexion</a>
      </section>
      <section className={`${cardClass} mt-3 space-y-2 p-4`}>
        <h2 className="font-bold">Calendrier iPhone</h2>
        <p className="text-sm text-slate-500">Abonnez-vous une fois. Ce lien contient les noms de vos clientes.</p>
        <p className="break-all rounded-2xl bg-white px-3 py-2 text-xs">{webcal}</p>
        <CopyButton value={ical} label="Copier le lien iCal" />
      </section>
    </SettingsScreen>
  );
}
