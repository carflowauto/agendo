"use client";

import { useState } from "react";
import { createInvitation } from "@/server/actions";
import { waHref } from "@/lib/phone";
import { btnPrimary, btnSecondary, fieldClass, labelClass } from "@/components/ui";
import { CopyButton } from "@/components/copy-button";

export function InviteDialog({ services }: { services: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [slots, setSlots] = useState<string[]>([""]);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const share = url
    ? `Bonjour, je vous propose un créneau. Choisissez l’horaire qui vous arrange : ${url}`
    : "";

  return (
    <>
      <button type="button" className={btnPrimary} onClick={() => { setOpen(true); setUrl(null); setError(null); }}>
        Inviter une cliente
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50" onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900">Inviter une cliente</h2>
              <button type="button" className="text-slate-400 text-2xl leading-none" onClick={() => setOpen(false)} aria-label="Fermer">&times;</button>
            </div>
            <p className="mt-2 text-sm text-slate-500">Le lien propose un ou plusieurs créneaux précis. La cliente indique son nom et son téléphone, le rendez-vous est confirmé.</p>
            {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
            {url ? (
              <div className="mt-4 space-y-3">
                <p className="text-sm font-medium break-all">{url}</p>
                <div className="flex flex-wrap gap-2">
                  <CopyButton value={url} label="Copier le lien" />
                  <a className={btnPrimary} href={waHref("", share)} target="_blank" rel="noreferrer">Envoyer sur WhatsApp</a>
                </div>
              </div>
            ) : (
              <form
                className="mt-4 space-y-3"
                onSubmit={async (event) => {
                  event.preventDefault();
                  setPending(true);
                  setError(null);
                  const result = await createInvitation(serviceId, slots.filter(Boolean));
                  setPending(false);
                  if (result.error) setError(result.error);
                  else if (result.url) setUrl(result.url);
                }}
              >
                <label className={labelClass}>
                  Prestation
                  <select className={fieldClass} value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>{service.name}</option>
                    ))}
                  </select>
                </label>
                {slots.map((slot, index) => (
                  <label key={index} className={labelClass}>
                    Créneau {index + 1}
                    <input type="datetime-local" required={index === 0} className={fieldClass} value={slot} onChange={(event) => setSlots((rows) => rows.map((item, i) => (i === index ? event.target.value : item)))} />
                  </label>
                ))}
                {slots.length < 8 ? (
                  <button type="button" className="text-sm font-semibold text-brand-700" onClick={() => setSlots((rows) => [...rows, ""])}>
                    Ajouter un créneau
                  </button>
                ) : null}
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" className={btnSecondary} onClick={() => setOpen(false)}>Annuler</button>
                  <button className={btnPrimary} disabled={pending || services.length === 0}>{pending ? "Création…" : "Créer le lien"}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
