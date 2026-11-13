import { weekdayName } from "@/lib/dates";
import { saveHours } from "@/server/actions";
import type { OpeningHour } from "@/lib/types";
import { fieldClass } from "@/components/ui";

export function HoursEditor({ hours }: { hours: OpeningHour[] }) {
  const byDay = new Map(hours.map((hour) => [hour.isodow, hour]));
  return (
    <form action={saveHours} className="space-y-2">
      <input type="hidden" name="retour" value="/espace/reglages/horaires" />
      {[1, 2, 3, 4, 5, 6, 7].map((day) => {
        const hour = byDay.get(day);
        return (
          <div key={day} className="grid grid-cols-[4.5rem_1fr_1fr_auto] items-center gap-1.5 rounded-2xl bg-white/80 px-2 py-2">
            <span className="text-sm font-medium">{weekdayName(day).slice(0, 3)}</span>
            <input type="time" name={`opens_${day}`} defaultValue={(hour?.opens ?? "09:30").slice(0, 5)} className={fieldClass + " mt-0 h-10 text-sm"} />
            <input type="time" name={`closes_${day}`} defaultValue={(hour?.closes ?? "18:30").slice(0, 5)} className={fieldClass + " mt-0 h-10 text-sm"} />
            <label className="text-[11px] text-slate-500">
              <input type="checkbox" name={`closed_${day}`} defaultChecked={hour ? hour.is_closed : day === 1 || day === 7} /> Fermé
            </label>
          </div>
        );
      })}
      <button className="h-11 w-full rounded-2xl grad text-sm font-semibold text-white">Enregistrer</button>
    </form>
  );
}
