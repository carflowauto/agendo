import { PhotoUploader } from "@/components/photo-uploader";
import { deletePhoto, movePhoto } from "@/server/actions";
import type { Photo } from "@/lib/types";

export function BoutiqueGallery({ photos, userId }: { photos: Photo[]; userId: string }) {
  return (
    <section className="mt-4 space-y-2">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Photos</h2>
        <PhotoUploader userId={userId} />
      </div>
      <ul className="space-y-2">
        {photos.length === 0 ? <li className="text-sm text-slate-500">Ajoutez des photos : elles défilent en haut de votre page.</li> : null}
        {photos.map((photo, index) => (
          <li key={photo.id} className="flex items-center gap-2 rounded-2xl bg-white/80 p-2">
            <img src={photo.url} alt="" className="h-14 w-14 rounded-xl object-cover" />
            <span className="text-xs text-slate-400">{index + 1}/{photos.length}</span>
            <div className="ml-auto flex gap-1">
              <form action={movePhoto}><input type="hidden" name="id" value={photo.id} /><input type="hidden" name="direction" value="up" /><button className="h-8 w-8 rounded-lg bg-white text-sm" aria-label="Monter">↑</button></form>
              <form action={movePhoto}><input type="hidden" name="id" value={photo.id} /><input type="hidden" name="direction" value="down" /><button className="h-8 w-8 rounded-lg bg-white text-sm" aria-label="Descendre">↓</button></form>
              <form action={deletePhoto}>
                <input type="hidden" name="retour" value="/espace/reglages/boutique" />
                <input type="hidden" name="id" value={photo.id} />
                <input type="hidden" name="url" value={photo.url} />
                <button className="h-8 rounded-lg px-2 text-xs font-semibold text-rose-600">Retirer</button>
              </form>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
