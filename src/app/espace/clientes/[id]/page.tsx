import Link from "next/link";
import { notFound } from "next/navigation";
import { Flash, PageHeader, cardClass, fieldClass, labelClass } from "@/components/ui";
import { formatDayLong, formatDuration, formatTime } from "@/lib/dates";
import { formatEuro } from "@/lib/money";
import { formatPhone, telHref, waHref } from "@/lib/phone";
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
  const { data: history } = await supabase
    .from("appointments")
    .select("*")
    .eq("profile_id", profile.id)
    .eq("client_id", id)
    .order("starts_at", { ascending: false });

  return (
    <div>
      <PageHeader title={row.full_name} subtitle={formatPhone(row.phone)}>
        <a className="h-10 px-4 inline-flex items-center rounded-xl border border-slate-300 text-sm font-semibold" href={telHref(row.phone)}>Appeler</a>
        <a className="h-10 px-4 inline-flex items-center rounded-xl bg-emerald-50 text-emerald-800 text-sm font-semibold" href={waHref(row.phone)} target="_blank" rel="noreferrer">WhatsApp</a>
      </PageHeader>
      <Flash ok={query.ok} erreur={query.erreur} />
      <div className="grid lg:grid-cols-2 gap-6 items-start">
        <form action={saveClient} className={`${cardClass} p-5 space-y-3`}>
          <input type="hidden" name="id" value={row.id} />
          <h2 className="font-bold">Fiche</h2>
          <label className={labelClass}>Nom<input name="name" defaultValue={row.full_name} required className={fieldClass} /></label>
          <label className={labelClass}>Téléphone<input name="phone" defaultValue={row.phone} required className={fieldClass} /></label>
          <label className={labelClass}>E-mail<input name="email" type="email" defaultValue={row.email ?? ""} className={fieldClass} /></label>
          <label className={labelClass}>Notes<textarea name="notes" rows={5} defaultValue={row.notes ?? ""} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <button className="h-10 px-4 rounded-xl grad text-white text-sm font-semibold">Enregistrer</button>
        </form>
        <section className={`${cardClass} p-5`}>
          <h2 className="font-bold">Historique</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {(history ?? []).length === 0 ? <li className="py-3 text-sm text-slate-500">Aucun rendez-vous.</li> : null}
            {((history ?? []) as Appointment[]).map((item) => (
              <li key={item.id} className="py-3 text-sm">
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
          <Link href="/espace/clientes" className="mt-4 inline-block text-sm font-semibold text-brand-700">Toutes les clientes</Link>
        </section>
      </div>
    </div>
  );
}
