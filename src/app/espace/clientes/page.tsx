import Link from "next/link";
import { ProColumn } from "@/components/pro-shell";
import { Flash, cardClass, fieldClass, labelClass } from "@/components/ui";
import { formatPhone, initials } from "@/lib/phone";
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
    <ProColumn
      header={
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Clientes</h1>
          <p className="text-sm text-slate-500">{clients.length} fiche{clients.length > 1 ? "s" : ""}</p>
          <Flash ok={params.ok} erreur={params.erreur} />
        </div>
      }
      actions={
        <form action="/espace/clientes">
          <input name="q" defaultValue={params.q ?? ""} placeholder="Rechercher une cliente" className={fieldClass} />
        </form>
      }
    >
      <ul className="space-y-2">
        {clients.length === 0 ? <li className={`${cardClass} px-4 py-5 text-sm text-slate-500`}>Aucune cliente pour cette recherche.</li> : null}
        {clients.map((client) => (
          <li key={client.id}>
            <Link href={`/espace/clientes/${client.id}`} className={`${cardClass} flex items-center gap-3 px-3 py-2.5`}>
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-pink-400 to-brand-500 text-sm font-bold text-white">{initials(client.full_name)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-slate-900">{client.full_name}</span>
                <span className="block text-sm text-slate-500">{formatPhone(client.phone)}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <details className={`${cardClass} mt-3 p-3`}>
        <summary className="cursor-pointer text-sm font-semibold">Nouvelle cliente</summary>
        <form action={saveClient} className="mt-3 space-y-2">
          <label className={labelClass}>Nom<input name="name" required className={fieldClass} /></label>
          <label className={labelClass}>Téléphone<input name="phone" required className={fieldClass} /></label>
          <label className={labelClass}>E-mail<input name="email" type="email" className={fieldClass} /></label>
          <label className={labelClass}>Notes<textarea name="notes" rows={2} className="mt-1 w-full rounded-2xl border border-white/80 bg-white px-3 py-2 text-sm" /></label>
          <button className="h-11 w-full rounded-2xl grad text-sm font-semibold text-white">Créer la fiche</button>
        </form>
      </details>
    </ProColumn>
  );
}
