import { formatDuration } from "@/lib/dates";
import { formatEuro } from "@/lib/money";
import { pendingSuggestions } from "@/lib/nail-services";
import { deleteService, saveService } from "@/server/actions";
import type { Service } from "@/lib/types";

const back = "/espace/reglages/prestations";

export function ServicesEditor({ services }: { services: Service[] }) {
  const suggestions = pendingSuggestions(services.map((service) => service.name));
  return (
    <div className="space-y-4">
      <section className="overflow-hidden rounded-[24px] bg-white/80">
        {services.length === 0 ? <p className="px-4 py-3 text-sm text-slate-500">Aucune prestation pour le moment.</p> : null}
        {services.map((service) => (
          <form key={service.id} action={saveService} className="border-b border-slate-100 px-3 py-3 last:border-0">
            <input type="hidden" name="retour" value={back} />
            <input type="hidden" name="id" value={service.id} />
            <p className="text-sm font-semibold text-slate-900">{service.name}</p>
            <input name="description" defaultValue={service.description ?? ""} placeholder="Description, facultative" className="mt-1 h-9 w-full rounded-xl bg-white px-2 text-sm text-slate-600" />
            <input type="hidden" name="name" value={service.name} />
            <div className="mt-2 grid grid-cols-[1fr_1fr_auto] gap-2">
              <label className="min-w-0 text-xs text-slate-500">Minutes
                <input name="duration_min" defaultValue={service.duration_min} className="mt-1 h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-2 text-sm" />
              </label>
              <label className="min-w-0 text-xs text-slate-500">Prix €
                <input name="price" defaultValue={(service.price_cents / 100).toString().replace(".", ",")} className="mt-1 h-10 w-full min-w-0 rounded-xl border border-slate-200 bg-white px-2 text-sm" />
              </label>
              <button className="self-end h-10 rounded-xl bg-brand-50 px-3 text-sm font-semibold text-brand-700">OK</button>
            </div>
            <p className="mt-1 text-xs text-slate-400">{formatDuration(service.duration_min)} · {formatEuro(service.price_cents)}</p>
            <button formAction={deleteService} className="text-xs font-semibold text-rose-600">Supprimer</button>
          </form>
        ))}
      </section>

      <section>
        <h2 className="px-1 text-sm font-semibold text-slate-500">Suggestions</h2>
        <div className="mt-2 space-y-2">
          {suggestions.length === 0 ? <p className="text-sm text-slate-500">Toutes les suggestions sont déjà dans votre carte.</p> : null}
          {suggestions.map((item) => (
            <form key={item.name} action={saveService} className="rounded-[20px] bg-white/80 px-3 py-2">
              <input type="hidden" name="retour" value={back} />
              <input name="name" defaultValue={item.name} aria-label={`Nom de ${item.name}`} className="h-9 w-full bg-transparent text-sm font-semibold text-slate-900" />
              <div className="mt-1 grid grid-cols-[1fr_1fr_2.5rem] gap-1.5">
                <input name="duration_min" defaultValue={item.durationMin} aria-label="Durée en minutes" className="h-10 min-w-0 rounded-xl bg-white px-2 text-sm" />
                <input name="price" defaultValue={(item.priceCents / 100).toString()} aria-label="Prix en euros" className="h-10 min-w-0 rounded-xl bg-white px-2 text-sm" />
                <button className="h-10 rounded-xl grad text-lg font-bold text-white" aria-label={`Ajouter ${item.name}`}>+</button>
              </div>
            </form>
          ))}
        </div>
      </section>

      <details className="rounded-[24px] bg-white/80 px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-brand-700">+ Prestation personnalisée</summary>
        <form action={saveService} className="mt-3 space-y-2">
          <input type="hidden" name="retour" value={back} />
          <input name="name" required placeholder="Nom" className="h-11 w-full rounded-2xl bg-white px-3 text-base" />
          <input name="description" placeholder="Description, facultative" className="h-11 w-full rounded-2xl bg-white px-3 text-base" />
          <div className="grid grid-cols-2 gap-2">
            <input name="duration_min" defaultValue="60" aria-label="Minutes" className="h-11 rounded-2xl bg-white px-3 text-base" />
            <input name="price" defaultValue="40" aria-label="Prix en euros" className="h-11 rounded-2xl bg-white px-3 text-base" />
          </div>
          <button className="h-11 w-full rounded-2xl grad text-sm font-semibold text-white">Ajouter</button>
        </form>
      </details>
    </div>
  );
}
