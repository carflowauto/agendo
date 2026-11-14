"use client";

import { useState } from "react";
import { vitrineLabel, vitrineUrl } from "@/lib/storefront";

export function ShareCard({ slug, name }: { slug: string; name: string }) {
  const url = vitrineUrl(slug);
  const label = vitrineLabel(slug);
  const [toast, setToast] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setToast(true);
    window.setTimeout(() => setToast(false), 1800);
  }

  async function share() {
    const payload = { title: name, text: `Réserve en ligne chez ${name}`, url };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        return;
      }
    }
    await copy();
  }

  return (
    <>
      <section className="rounded-2xl bg-white/80 p-3 shadow-sm ring-1 ring-brand-100">
        <p className="break-all text-sm font-semibold leading-snug text-brand-800">{label}</p>
        <p className="mt-0.5 text-xs text-slate-500">Mets ce lien dans ta bio Instagram.</p>
        <div className="mt-2 grid grid-cols-3 gap-1.5">
          <button type="button" onClick={() => void copy()} className="h-9 rounded-xl grad text-[11px] font-semibold text-white">Copier mon lien</button>
          <button type="button" onClick={() => void share()} className="h-9 rounded-xl bg-white text-[11px] font-semibold text-slate-800 ring-1 ring-slate-200">Partager</button>
          <a href={`/${slug}`} target="_blank" rel="noreferrer" className="flex h-9 items-center justify-center rounded-xl bg-white text-[11px] font-semibold text-slate-800 ring-1 ring-slate-200">Voir ma page</a>
        </div>
      </section>
      {toast ? (
        <p className="fixed bottom-[4.75rem] left-1/2 z-40 -translate-x-1/2 rounded-full bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-lg" role="status">
          Lien copié
        </p>
      ) : null}
    </>
  );
}
