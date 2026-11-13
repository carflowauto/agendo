import { SettingsScreen } from "@/components/settings-screen";
import { cardClass, fieldClass, labelClass } from "@/components/ui";
import { addTimeOff, deleteTimeOff } from "@/server/actions";
import { requireProfile } from "@/server/profile";

export const metadata = { title: "Congés" };

export default async function TimeOffPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const params = await searchParams;
  const { supabase, profile } = await requireProfile();
  const { data } = await supabase.from("time_off").select("*").eq("profile_id", profile.id).order("starts_on");
  const periods = (data ?? []) as { id: string; starts_on: string; ends_on: string; reason: string | null }[];
  return (
    <SettingsScreen title="Congés" hint="Aucun créneau n’est proposé sur ces dates" ok={params.ok} erreur={params.erreur}>
      <ul className={`${cardClass} divide-y divide-slate-100`}>
        {periods.length === 0 ? <li className="px-4 py-3 text-sm text-slate-500">Aucune fermeture.</li> : null}
        {periods.map((period) => (
          <li key={period.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
            <span>{period.starts_on} → {period.ends_on}{period.reason ? ` · ${period.reason}` : ""}</span>
            <form action={deleteTimeOff}>
              <input type="hidden" name="id" value={period.id} />
              <button className="font-semibold text-rose-600">Retirer</button>
            </form>
          </li>
        ))}
      </ul>
      <form action={addTimeOff} className="mt-3 space-y-2">
        <label className={labelClass}>Du<input type="date" name="starts_on" required className={fieldClass} /></label>
        <label className={labelClass}>Au<input type="date" name="ends_on" required className={fieldClass} /></label>
        <label className={labelClass}>Motif<input name="reason" className={fieldClass} placeholder="Vacances" /></label>
        <button className="h-11 w-full rounded-2xl grad text-sm font-semibold text-white">Ajouter</button>
      </form>
    </SettingsScreen>
  );
}
