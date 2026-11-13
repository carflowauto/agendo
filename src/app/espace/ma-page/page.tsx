import { CopyButton } from "@/components/copy-button";
import { PhotoUploader } from "@/components/photo-uploader";
import { ProColumn } from "@/components/pro-shell";
import { QrCode } from "@/components/qr-code";
import { Flash, cardClass, fieldClass } from "@/components/ui";
import { requestOrigin } from "@/lib/origin";
import { smsHref, waHref } from "@/lib/phone";
import { addPhoto, deletePhoto } from "@/server/actions";
import { requireProfile } from "@/server/profile";
import type { Photo } from "@/lib/types";

export const metadata = { title: "Ma page" };

export default async function MyPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const params = await searchParams;
  const { profile, supabase } = await requireProfile();
  const { data: photos } = await supabase.from("photos").select("*").eq("profile_id", profile.id).order("sort_order");
  const origin = await requestOrigin();
  const url = `${origin}/${profile.slug}`;
  const text = `Réservez en ligne chez ${profile.full_name} : ${url}`;

  return (
    <ProColumn
      header={
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Ma page</h1>
          <p className="text-sm text-slate-500">Le lien que vos clientes ouvrent</p>
          <Flash ok={params.ok} erreur={params.erreur} />
        </div>
      }
      actions={
        <div className={`${cardClass} px-3 py-3`}>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-700">{profile.profession}</p>
          <p className="text-lg font-extrabold text-slate-900">{profile.full_name}</p>
          <p className="text-sm text-slate-500">{[profile.city, profile.address].filter(Boolean).join(" · ") || "Ajoutez l’adresse dans Réglages"}</p>
        </div>
      }
    >
      <p className="break-all rounded-2xl bg-white/80 px-3 py-2 text-sm font-medium text-slate-700">{url}</p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        <CopyButton value={url} label="Copier le lien" />
        <a className="flex h-11 items-center justify-center rounded-2xl bg-white/80 text-sm font-semibold" href={url} target="_blank" rel="noreferrer">Aperçu</a>
        <a className="flex h-11 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-semibold text-emerald-800" href={waHref("", text)} target="_blank" rel="noreferrer">WhatsApp</a>
        <a className="flex h-11 items-center justify-center rounded-2xl bg-white/80 text-sm font-semibold" href={smsHref("", text)}>SMS</a>
      </div>
      <div className={`${cardClass} mt-3 flex justify-center p-3`}>
        <QrCode value={url} size={168} />
      </div>
      <section className={`${cardClass} mt-3 p-3`}>
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold">Photos</h2>
          <PhotoUploader userId={profile.id} />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          {((photos ?? []) as Photo[]).map((photo) => (
            <figure key={photo.id}>
              <img src={photo.url} alt={photo.caption ?? ""} className="h-20 w-full rounded-xl object-cover" />
              <form action={deletePhoto}>
                <input type="hidden" name="id" value={photo.id} />
                <input type="hidden" name="url" value={photo.url} />
                <button className="text-xs font-semibold text-rose-600">Retirer</button>
              </form>
            </figure>
          ))}
        </div>
        <form action={addPhoto} className="mt-2 flex gap-2">
          <input name="url" placeholder="https://…" className={fieldClass + " mt-0"} />
          <button className="h-11 shrink-0 rounded-2xl bg-white px-3 text-sm font-semibold">OK</button>
        </form>
      </section>
    </ProColumn>
  );
}
