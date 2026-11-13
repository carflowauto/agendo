import Link from "next/link";
import { Flash, PageHeader, cardClass, fieldClass, labelClass } from "@/components/ui";
import { formatPhone } from "@/lib/phone";
import { saveClient } from "@/server/actions";
import { requireProfile } from "@/server/profile";
import type { ClientRow } from "@/lib/types";

export const metadata = { title: "Clientes" };

export default async function ClientsPage({ searchParams }: { searchParams: Promise<{ q?: string; ok?: string; erreur?: string }> }) {
  const params = await searchParams;
  const { supabase, profile } = await requireProfile();
  const q = (params.q ?? "").replace(/[%_,]/g, " ").trim();
  let query = supabase.from("clients").select("*").eq("profile_id", profile.id).order("full_name");
  if (q) query = query.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);
  const { data } = await query;
  const clients = (data ?? []) as ClientRow[];

  return (
    <div>
      <PageHeader title="Clientes" subtitle={`${clients.length} fiche${clients.length > 1 ? "s" : ""}`} />
      <Flash ok={params.ok} erreur={params.erreur} />
      <form className="mb-4" action="/espace/clientes">
        <input name="q" defaultValue={params.q ?? ""} placeholder="Nom ou téléphone" className={fieldClass + " max-w-sm"} />
      </form>
      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <ul className={`${cardClass} divide-y divide-slate-100`}>
          {clients.length === 0 ? <li className="p-6 text-sm text-slate-500">Aucune cliente pour l’instant.</li> : null}
          {clients.map((client) => (
            <li key={client.id}>
              <Link href={`/espace/clientes/${client.id}`} className="flex items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50">
                <span>
                  <span className="block font-semibold text-slate-900">{client.full_name}</span>
                  <span className="block text-sm text-slate-500">{formatPhone(client.phone)}</span>
                </span>
                <span className="text-sm text-brand-700 font-semibold">Ouvrir</span>
              </Link>
            </li>
          ))}
        </ul>
        <form action={saveClient} className={`${cardClass} p-4 space-y-3`}>
          <h2 className="font-bold">Nouvelle cliente</h2>
          <label className={labelClass}>Nom<input name="name" required className={fieldClass} /></label>
          <label className={labelClass}>Téléphone<input name="phone" required className={fieldClass} /></label>
          <label className={labelClass}>E-mail<input name="email" type="email" className={fieldClass} /></label>
          <label className={labelClass}>Notes<textarea name="notes" rows={3} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
          <button className="w-full h-10 rounded-xl grad text-white text-sm font-semibold">Créer la fiche</button>
        </form>
      </div>
    </div>
  );
}
