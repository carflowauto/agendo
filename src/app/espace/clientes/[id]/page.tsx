import Link from "next/link";
import { notFound } from "next/navigation";
import { ProColumn } from "@/components/pro-shell";
import { Flash, cardClass, fieldClass, labelClass } from "@/components/ui";
import { addDays, formatDayLong, formatDuration, formatTime, parisDateKey } from "@/lib/dates";
import { formatEuro } from "@/lib/money";
import { requestOrigin } from "@/lib/origin";
import { firstName, formatPhone, telHref, waHref } from "@/lib/phone";
import { saveClient } from "@/server/actions";
import { requireProfile } from "@/server/profile";
import type { Appointment, ClientRow } from "@/lib/types";

export const metadata = { title: "Fiche cliente" };

export default async function ClientPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ok?: string; erreur?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { supabase, profile } = await requireProfile();
  const { data: client } = await supabase.from("clients").select("*").eq("id", id).eq("profile_id", profile.id).maybeSingle();
  if (!client) notFound();
  const row = client as ClientRow;
  const { data: history } = await supabase.from("appointments").select("*").eq("profile_id", profile.id).eq("client_id", id).order("starts_at", { ascending: false });
  const visits = (history ?? []) as Appointment[];
  const today = parisDateKey();
  const target = addDays(today, -profile.refill_weeks * 7);
  const due = visits.some((item) => {
    if (item.status !== "confirmed") return false;
    const key = parisDateKey(new Date(item.starts_at));
    return key >= addDays(target, -1) && key <= addDays(target, 1);
  });
  const hasFuture = visits.some((item) => item.status === "confirmed" && new Date(item.starts_at).getTime() > Date.now());
  const origin = await requestOrigin();
  const refillText = `Bonjour ${firstName(row.full_name)}, c’est l’heure du remplissage 💅 On cale un créneau ? ${origin}/${profile.slug}`;

  return (
    <ProColumn
      header={
        <div>
          <Link href="/espace/clientes" className="text-sm font-semibold text-brand-700">‹ Clientes</Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{row.full_name}</h1>
          <p className="text-sm text-slate-500">{formatPhone(row.phone)}</p>
          <Flash ok={query.ok} erreur={query.erreur} />
        </div>
      }
      actions={
        <div className="grid grid-cols-2 gap-2">
          <a className="flex h-11 items-center justify-center rounded-2xl bg-white text-sm font-semibold shadow-sm" href={telHref(row.phone)}>Appeler</a>
          <a className="flex h-11 items-center justify-center rounded-2xl bg-emerald-50 text-sm font-semibold text-emerald-800" href={waHref(row.phone)} target="_blank" rel="noreferrer">WhatsApp</a>
        </div>
      }
    >
      {due && !hasFuture ? (
        <a href={waHref(row.phone, refillText)} className={`${cardClass} mb-3 block px-3 py-3 text-sm`} target="_blank" rel="noreferrer">
          <span className="font-semibold text-slate-900">C’est l’heure du remplissage</span>
          <span className="mt-1 block text-emerald-700">Envoyer le rappel sur WhatsApp</span>
        </a>
      ) : null}
      <form action={saveClient} className={`${cardClass} space-y-2 p-3`}>
        <input type="hidden" name="id" value={row.id} />
        <h2 className="font-semibold">Notes</h2>
        <label className={labelClass}>Nom<input name="name" defaultValue={row.full_name} required className={fieldClass} /></label>
        <label className={labelClass}>Téléphone<input name="phone" defaultValue={row.phone} required className={fieldClass} /></label>
        <label className={labelClass}>E-mail<input name="email" type="email" defaultValue={row.email ?? ""} className={fieldClass} /></label>
        <textarea name="notes" rows={3} defaultValue={row.notes ?? ""} placeholder="Préférences, allergies, forme des ongles…" className="w-full rounded-2xl border border-white/80 bg-white px-3 py-2 text-sm" />
        <button className="h-11 w-full rounded-2xl grad text-sm font-semibold text-white">Enregistrer</button>
      </form>
      <section className={`${cardClass} mt-3 p-3`}>
        <h2 className="font-semibold">Historique</h2>
        <ul className="mt-2 divide-y divide-slate-100">
          {visits.length === 0 ? <li className="py-2 text-sm text-slate-500">Aucun rendez-vous.</li> : null}
          {visits.map((item) => (
            <li key={item.id} className="py-2 text-sm">
              <p className="font-semibold text-slate-900">{item.service_name ?? "Rendez-vous"}</p>
              <p className="text-slate-500">
                {formatDayLong(item.starts_at)} · {formatTime(item.starts_at)}
                {item.duration_min ? ` · ${formatDuration(item.duration_min)}` : ""}
                {item.price_cents ? ` · ${formatEuro(item.price_cents)}` : ""}
                {item.status === "cancelled" ? " · annulé" : ""}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </ProColumn>
  );
}
