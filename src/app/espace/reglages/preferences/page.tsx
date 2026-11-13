import { SettingsScreen } from "@/components/settings-screen";
import { fieldClass, labelClass } from "@/components/ui";
import { saveSettings } from "@/server/actions";
import { requireProfile } from "@/server/profile";

export const metadata = { title: "Délais et rappels" };

export default async function PreferencesPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const params = await searchParams;
  const { profile } = await requireProfile();
  return (
    <SettingsScreen title="Délais et rappels" ok={params.ok} erreur={params.erreur}>
      <form action={saveSettings} className="space-y-3">
        <label className={labelClass}>Délai minimum (heures)<input name="min_notice_hours" type="number" min={0} step="0.5" defaultValue={profile.min_notice_minutes / 60} className={fieldClass} /></label>
        <label className={labelClass}>Rappel (heures avant)<input name="reminder_hours" type="number" min={0} defaultValue={profile.reminder_hours} className={fieldClass} /></label>
        <label className={labelClass}>Remplissage (semaines)<input name="refill_weeks" type="number" min={1} defaultValue={profile.refill_weeks} className={fieldClass} /></label>
        <button className="h-11 w-full rounded-2xl grad text-sm font-semibold text-white">Enregistrer</button>
      </form>
    </SettingsScreen>
  );
}
