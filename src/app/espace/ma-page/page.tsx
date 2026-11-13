import { CopyButton } from "@/components/copy-button";
import { PhotoUploader } from "@/components/photo-uploader";
import { QrCode } from "@/components/qr-code";
import { Flash, PageHeader, cardClass, fieldClass, labelClass } from "@/components/ui";
import { formatDuration, weekdayName } from "@/lib/dates";
import { formatEuro } from "@/lib/money";
import { requestOrigin } from "@/lib/origin";
import { addPhoto, deletePhoto, deleteService, saveHours, saveProfile, saveService } from "@/server/actions";
import { requireProfile } from "@/server/profile";
import type { OpeningHour, Photo, Service } from "@/lib/types";

export const metadata = { title: "Ma page" };

export default async function MyPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const params = await searchParams;
  const { profile, supabase } = await requireProfile();
  const { data: services } = await supabase.from("services").select("*").eq("profile_id", profile.id).order("sort_order");
  const { data: hours } = await supabase.from("opening_hours").select("*").eq("profile_id", profile.id).order("isodow");
  const { data: photos } = await supabase.from("photos").select("*").eq("profile_id", profile.id).order("sort_order");
  const origin = await requestOrigin();
  const url = `${origin}/${profile.slug}`;
  const hourRows = (hours ?? []) as OpeningHour[];
  const byDay = new Map(hourRows.map((hour) => [hour.isodow, hour]));

  return (
    <div className="space-y-6">
      <PageHeader title="Ma page" subtitle="Ce que voient vos clientes" />
      <Flash ok={params.ok} erreur={params.erreur} />
      <section className={`${cardClass} p-5 grid md:grid-cols-[220px_1fr] gap-6 items-center`}>
        <QrCode value={url} />
        <div>
          <p className="text-sm text-slate-500">Lien vitrine</p>
          <p className="mt-1 font-semibold break-all">{url}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <CopyButton value={url} label="Copier le lien" />
            <a className="inline-flex h-10 px-4 items-center rounded-xl border border-slate-300 text-sm font-semibold" href={url} target="_blank" rel="noreferrer">Ouvrir</a>
          </div>
        </div>
      </section>

      <form action={saveProfile} className={`${cardClass} p-5 space-y-3`}>
        <h2 className="font-bold">Présentation</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className={labelClass}>Nom<input name="full_name" required defaultValue={profile.full_name} className={fieldClass} /></label>
          <label className={labelClass}>Métier<input name="profession" required defaultValue={profile.profession} className={fieldClass} /></label>
          <label className={labelClass}>Ville<input name="city" defaultValue={profile.city} className={fieldClass} /></label>
          <label className={labelClass}>Téléphone<input name="phone" defaultValue={profile.phone} className={fieldClass} /></label>
        </div>
        <label className={labelClass}>Adresse<input name="address" defaultValue={profile.address ?? ""} className={fieldClass} /></label>
        <label className={labelClass}>Texte de la page<textarea name="bio" rows={3} defaultValue={profile.bio ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
        <label className={labelClass}>
          Adresse de la page
          <span className="mt-1 flex rounded-lg border border-slate-300 overflow-hidden">
            <span className="px-3 flex items-center bg-slate-50 text-sm text-slate-500 border-r border-slate-300">/</span>
            <input name="slug" defaultValue={profile.slug} required className="flex-1 px-3 h-10 text-sm outline-none" />
          </span>
        </label>
        <button className="h-10 px-4 rounded-xl grad text-white text-sm font-semibold">Enregistrer</button>
      </form>

      <section className={`${cardClass} p-5`}>
        <h2 className="font-bold">Prestations</h2>
        <ul className="mt-4 space-y-4">
          {((services ?? []) as Service[]).map((service) => (
            <li key={service.id} className="border border-slate-100 rounded-xl p-3">
              <form action={saveService} className="grid sm:grid-cols-4 gap-2 items-end">
                <input type="hidden" name="id" value={service.id} />
                <label className={labelClass}>Nom<input name="name" defaultValue={service.name} className={fieldClass} /></label>
                <label className={labelClass}>Minutes<input name="duration_min" defaultValue={service.duration_min} className={fieldClass} /></label>
                <label className={labelClass}>Prix €<input name="price" defaultValue={(service.price_cents / 100).toString().replace(".", ",")} className={fieldClass} /></label>
                <button className="h-10 rounded-lg border border-slate-300 text-sm font-semibold">Modifier</button>
                <label className={`${labelClass} sm:col-span-4`}>Description<input name="description" defaultValue={service.description ?? ""} className={fieldClass} /></label>
              </form>
              <p className="mt-1 text-xs text-slate-400">{formatDuration(service.duration_min)} · {formatEuro(service.price_cents)}</p>
              <form action={deleteService}>
                <input type="hidden" name="id" value={service.id} />
                <button className="text-sm text-rose-600 font-semibold">Retirer</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={saveService} className="mt-4 grid sm:grid-cols-4 gap-2 items-end">
          <label className={labelClass}>Nouvelle<input name="name" placeholder="Nail art" className={fieldClass} /></label>
          <label className={labelClass}>Minutes<input name="duration_min" defaultValue="45" className={fieldClass} /></label>
          <label className={labelClass}>Prix €<input name="price" defaultValue="20" className={fieldClass} /></label>
          <button className="h-10 rounded-xl grad text-white text-sm font-semibold">Ajouter</button>
        </form>
      </section>

      <form action={saveHours} className={`${cardClass} p-5`}>
        <h2 className="font-bold">Horaires</h2>
        <div className="mt-4 space-y-2">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => {
            const hour = byDay.get(day);
            return (
              <div key={day} className="grid grid-cols-[7rem_1fr_1fr_auto] gap-2 items-center">
                <span className="text-sm">{weekdayName(day)}</span>
                <input type="time" name={`opens_${day}`} defaultValue={(hour?.opens ?? "09:30").slice(0, 5)} className={fieldClass + " mt-0"} />
                <input type="time" name={`closes_${day}`} defaultValue={(hour?.closes ?? "18:30").slice(0, 5)} className={fieldClass + " mt-0"} />
                <label className="text-xs text-slate-600 flex items-center gap-1">
                  <input type="checkbox" name={`closed_${day}`} defaultChecked={hour?.is_closed ?? false} />
                  Fermé
                </label>
              </div>
            );
          })}
        </div>
        <button className="mt-4 h-10 px-4 rounded-xl grad text-white text-sm font-semibold">Enregistrer les horaires</button>
      </form>

      <section className={`${cardClass} p-5`}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-bold">Photos</h2>
          <PhotoUploader userId={profile.id} />
        </div>
        <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
          {((photos ?? []) as Photo[]).map((photo) => (
            <figure key={photo.id} className="relative">
              <img src={photo.url} alt={photo.caption ?? ""} className="h-36 w-full object-cover rounded-xl border border-slate-200" />
              <form action={deletePhoto}>
                <input type="hidden" name="id" value={photo.id} />
                <input type="hidden" name="url" value={photo.url} />
                <button className="mt-1 text-xs font-semibold text-rose-600">Retirer</button>
              </form>
            </figure>
          ))}
        </div>
        <form action={addPhoto} className="mt-4 flex flex-col sm:flex-row gap-2">
          <input name="url" placeholder="https://… ou envoyez un fichier ci-dessus" className={fieldClass + " mt-0"} />
          <button className="h-10 px-4 rounded-xl border border-slate-300 text-sm font-semibold">Ajouter l’URL</button>
        </form>
      </section>
    </div>
  );
}
