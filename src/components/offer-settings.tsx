import { formatDuration, weekdayName } from "@/lib/dates";
import { formatEuro } from "@/lib/money";
import { deleteService, saveHours, saveService } from "@/server/actions";
import type { OpeningHour, Service } from "@/lib/types";
import { cardClass, fieldClass, labelClass } from "@/components/ui";

export function OfferSettings({ services, hours }: { services: Service[]; hours: OpeningHour[] }) {
  const byDay = new Map(hours.map((hour) => [hour.isodow, hour]));
  return (
    <>
      <section id="prestations" className={`${cardClass} p-5 scroll-mt-24`}>
        <h2 className="font-bold">Prestations</h2>
        <p className="mt-1 text-sm text-slate-500">Elles apparaissent sur votre page de réservation.</p>
        <ul className="mt-4 space-y-4">
          {services.length === 0 ? <li className="text-sm text-slate-500">Aucune prestation pour le moment.</li> : null}
          {services.map((service) => (
            <li key={service.id} className="border border-slate-100 rounded-xl p-3">
              <form action={saveService} className="grid sm:grid-cols-4 gap-2 items-end">
                <input type="hidden" name="retour" value="/espace/reglages" />
                <input type="hidden" name="id" value={service.id} />
                <label className={labelClass}>Nom<input name="name" defaultValue={service.name} className={fieldClass} /></label>
                <label className={labelClass}>Minutes<input name="duration_min" defaultValue={service.duration_min} className={fieldClass} /></label>
                <label className={labelClass}>Prix €<input name="price" defaultValue={(service.price_cents / 100).toString().replace(".", ",")} className={fieldClass} /></label>
                <button className="h-10 rounded-lg border border-slate-300 text-sm font-semibold">Modifier</button>
                <label className={`${labelClass} sm:col-span-4`}>Description<input name="description" defaultValue={service.description ?? ""} className={fieldClass} /></label>
              </form>
              <p className="mt-1 text-xs text-slate-400">{formatDuration(service.duration_min)} · {formatEuro(service.price_cents)}</p>
              <form action={deleteService}>
                <input type="hidden" name="retour" value="/espace/reglages" />
                <input type="hidden" name="id" value={service.id} />
                <button className="text-sm text-rose-600 font-semibold">Retirer</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={saveService} className="mt-4 grid sm:grid-cols-4 gap-2 items-end">
          <input type="hidden" name="retour" value="/espace/reglages" />
          <label className={labelClass}>Nouvelle<input name="name" placeholder="Remplissage" className={fieldClass} /></label>
          <label className={labelClass}>Minutes<input name="duration_min" defaultValue="75" className={fieldClass} /></label>
          <label className={labelClass}>Prix €<input name="price" defaultValue="45" className={fieldClass} /></label>
          <button className="h-10 rounded-xl grad text-white text-sm font-semibold">Ajouter</button>
        </form>
      </section>

      <form id="horaires" action={saveHours} className={`${cardClass} p-5 scroll-mt-24`}>
        <input type="hidden" name="retour" value="/espace/reglages" />
        <h2 className="font-bold">Horaires</h2>
        <p className="mt-1 text-sm text-slate-500">Les créneaux libres de la vitrine suivent ces horaires.</p>
        <div className="mt-4 space-y-2">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const hour = byDay.get(day);
            return (
              <div key={day} className="grid grid-cols-[7rem_1fr_1fr_auto] gap-2 items-center">
                <span className="text-sm">{weekdayName(day)}</span>
                <input type="time" name={`opens_${day}`} defaultValue={(hour?.opens ?? "09:30").slice(0, 5)} className={fieldClass + " mt-0"} />
                <input type="time" name={`closes_${day}`} defaultValue={(hour?.closes ?? "18:30").slice(0, 5)} className={fieldClass + " mt-0"} />
                <label className="text-xs text-slate-600 flex items-center gap-1">
                  <input type="checkbox" name={`closed_${day}`} defaultChecked={hour ? hour.is_closed : day === 1 || day === 7} />
                  Fermé
                </label>
              </div>
            );
          })}
        </div>
        <button className="mt-4 h-10 px-4 rounded-xl grad text-white text-sm font-semibold">Enregistrer les horaires</button>
      </form>
    </>
  );
}
