import Link from "next/link";
import { Flash, PageHeader, btnSecondary, cardClass, fieldClass, labelClass } from "@/components/ui";
import { InviteDialog } from "@/components/invite-dialog";
import { WeekAgenda } from "@/components/week-agenda";
import { addDays, formatDayShort, isDateKey, mondayOf, parisDateKey, zonedWallTimeToUtc } from "@/lib/dates";
import { createAppointment, createBlock } from "@/server/actions";
import { requireProfile } from "@/server/profile";
import type { Appointment, ClientRow, Service } from "@/lib/types";

export const metadata = { title: "Agenda" };

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ semaine?: string; ok?: string; erreur?: string }> }) {
  const params = await searchParams;
  const { supabase, profile } = await requireProfile();
  const today = parisDateKey();
  const monday = params.semaine && isDateKey(params.semaine) ? mondayOf(params.semaine) : mondayOf(today);
  const from = zonedWallTimeToUtc(monday, "00:00", profile.timezone);
  const to = zonedWallTimeToUtc(addDays(monday, 7), "00:00", profile.timezone);
  const { data: rows } = await supabase
    .from("appointments")
    .select("*")
    .eq("profile_id", profile.id)
    .neq("status", "cancelled")
    .lt("starts_at", to.toISOString())
    .gt("ends_at", from.toISOString())
    .order("starts_at");
  const { data: services } = await supabase.from("services").select("*").eq("profile_id", profile.id).eq("active", true).order("sort_order");
  const { data: clients } = await supabase.from("clients").select("id, full_name, phone").eq("profile_id", profile.id).order("full_name");
  const serviceList = (services ?? []) as Service[];
  const clientList = (clients ?? []) as Pick<ClientRow, "id" | "full_name" | "phone">[];

  return (
    <div>
      <PageHeader title="Agenda" subtitle={`${formatDayShort(monday)} – ${formatDayShort(addDays(monday, 6))}`}>
        <Link href={`/espace/agenda?semaine=${addDays(monday, -7)}`} className={btnSecondary}>Semaine précédente</Link>
        <Link href="/espace/agenda" className={btnSecondary}>Aujourd’hui</Link>
        <Link href={`/espace/agenda?semaine=${addDays(monday, 7)}`} className={btnSecondary}>Semaine suivante</Link>
        <InviteDialog services={serviceList.map((service) => ({ id: service.id, name: service.name }))} />
      </PageHeader>
      <Flash ok={params.ok} erreur={params.erreur} />
      <div className="grid xl:grid-cols-[1fr_320px] gap-6 items-start">
        <WeekAgenda weekStart={monday} items={(rows ?? []) as Appointment[]} />
        <div className="space-y-4">
          <form action={createAppointment} className={`${cardClass} p-4 space-y-3`}>
            <h2 className="font-bold text-slate-900">Ajouter un rendez-vous</h2>
            <label className={labelClass}>Cliente<input name="name" required list="clientes" className={fieldClass} placeholder="Nom" /></label>
            <datalist id="clientes">
              {clientList.map((client) => <option key={client.id} value={client.full_name}>{client.phone}</option>)}
            </datalist>
            <label className={labelClass}>Téléphone<input name="phone" className={fieldClass} placeholder="Optionnel si la fiche existe" /></label>
            <label className={labelClass}>
              Prestation
              <select name="service_id" required className={fieldClass}>
                {serviceList.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className={labelClass}>Date<input type="date" name="date" required defaultValue={today} className={fieldClass} /></label>
              <label className={labelClass}>Heure<input type="time" name="time" required defaultValue="10:00" className={fieldClass} /></label>
            </div>
            <label className={labelClass}>Note<textarea name="notes" rows={2} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" /></label>
            <button className="w-full h-10 rounded-xl grad text-white text-sm font-semibold">Enregistrer</button>
          </form>
          <form action={createBlock} className={`${cardClass} p-4 space-y-3`}>
            <h2 className="font-bold text-slate-900">Bloquer un créneau</h2>
            <label className={labelClass}>Libellé<input name="label" defaultValue="Pause" className={fieldClass} /></label>
            <label className={labelClass}>Date<input type="date" name="date" required defaultValue={today} className={fieldClass} /></label>
            <div className="grid grid-cols-2 gap-2">
              <label className={labelClass}>Début<input type="time" name="start" required defaultValue="12:30" className={fieldClass} /></label>
              <label className={labelClass}>Fin<input type="time" name="end" required defaultValue="13:30" className={fieldClass} /></label>
            </div>
            <button className="w-full h-10 rounded-xl border border-slate-300 text-sm font-semibold">Bloquer</button>
          </form>
        </div>
      </div>
    </div>
  );
}
