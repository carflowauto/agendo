import Link from "next/link";
import { ProColumn } from "@/components/pro-shell";
import { WeekAgenda } from "@/components/week-agenda";
import { Flash, btnSecondary, cardClass, fieldClass, labelClass } from "@/components/ui";
import { addDays, formatDayLong, formatDayShort, formatHm, formatTime, isDateKey, mondayOf, parisDateKey, zonedWallTimeToUtc } from "@/lib/dates";
import { buildSlots, hourForDate } from "@/lib/slots";
import { createAppointment, createBlock } from "@/server/actions";
import { requireProfile } from "@/server/profile";
import type { Appointment, ClientRow, OpeningHour, Service } from "@/lib/types";

export const metadata = { title: "Agenda" };

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ jour?: string; vue?: string; semaine?: string; heure?: string; ok?: string; erreur?: string }> }) {
  const params = await searchParams;
  const { supabase, profile } = await requireProfile();
  const today = parisDateKey();
  const day = params.jour && isDateKey(params.jour) ? params.jour : today;
  const week = params.vue === "semaine";
  const monday = params.semaine && isDateKey(params.semaine) ? mondayOf(params.semaine) : mondayOf(week ? day : today);
  const rangeStart = week ? monday : day;
  const rangeEnd = addDays(rangeStart, week ? 7 : 1);
  const from = zonedWallTimeToUtc(rangeStart, "00:00", profile.timezone);
  const to = zonedWallTimeToUtc(rangeEnd, "00:00", profile.timezone);
  const [{ data: rows }, { data: services }, { data: clients }, { data: hours }, { data: timeOff }] = await Promise.all([
    supabase.from("appointments").select("*").eq("profile_id", profile.id).neq("status", "cancelled").lt("starts_at", to.toISOString()).gt("ends_at", from.toISOString()).order("starts_at"),
    supabase.from("services").select("*").eq("profile_id", profile.id).eq("active", true).order("sort_order"),
    supabase.from("clients").select("id, full_name, phone").eq("profile_id", profile.id).order("full_name"),
    supabase.from("opening_hours").select("*").eq("profile_id", profile.id),
    supabase.from("time_off").select("starts_on, ends_on").eq("profile_id", profile.id),
  ]);
  const items = (rows ?? []) as Appointment[];
  const serviceList = (services ?? []) as Service[];
  const clientList = (clients ?? []) as Pick<ClientRow, "id" | "full_name" | "phone">[];
  const hour = hourForDate((hours ?? []) as OpeningHour[], day);
  const duration = serviceList.reduce((min, service) => Math.min(min, service.duration_min), serviceList[0]?.duration_min ?? 60);
  const free = buildSlots({
    date: day,
    timeZone: profile.timezone || "Europe/Paris",
    durationMin: duration,
    opens: hour?.opens ?? null,
    closes: hour?.closes ?? null,
    isClosed: !hour || hour.is_closed,
    minNoticeMinutes: profile.min_notice_minutes,
    busy: items.map((item) => ({ starts_at: item.starts_at, ends_at: item.ends_at })),
    timeOff: (timeOff ?? []) as { starts_on: string; ends_on: string }[],
    stepMin: 30,
  });

  return (
    <ProColumn
      header={
        <div>
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{week ? "Semaine" : "Journée"}</h1>
            <div className="flex rounded-full bg-white/70 p-1 text-xs font-semibold">
              <Link href={`/espace/agenda?jour=${day}`} className={`rounded-full px-3 py-1 ${week ? "text-slate-500" : "bg-white text-brand-700 shadow-sm"}`}>Jour</Link>
              <Link href={`/espace/agenda?vue=semaine&semaine=${mondayOf(day)}`} className={`rounded-full px-3 py-1 ${week ? "bg-white text-brand-700 shadow-sm" : "text-slate-500"}`}>Semaine</Link>
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            {week ? (
              <>
                <Link href={`/espace/agenda?vue=semaine&semaine=${addDays(monday, -7)}`} className="font-semibold text-brand-700">‹</Link>
                <p className="font-medium text-slate-700">{formatDayShort(monday)} – {formatDayShort(addDays(monday, 6))}</p>
                <Link href={`/espace/agenda?vue=semaine&semaine=${addDays(monday, 7)}`} className="font-semibold text-brand-700">›</Link>
              </>
            ) : (
              <>
                <Link href={`/espace/agenda?jour=${addDays(day, -1)}`} className="font-semibold text-brand-700">‹</Link>
                <p className="font-medium capitalize text-slate-700">{formatDayLong(day)}</p>
                <Link href={`/espace/agenda?jour=${addDays(day, 1)}`} className="font-semibold text-brand-700">›</Link>
              </>
            )}
          </div>
          <Flash ok={params.ok} erreur={params.erreur} />
        </div>
      }
      actions={
        week ? null : (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {free.length === 0 ? <span className="text-xs text-slate-500">Aucun créneau libre ce jour</span> : free.slice(0, 8).map((slot) => (
              <Link key={slot} href={`/espace/agenda?jour=${day}&heure=${formatHm(slot)}`} className="shrink-0 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-brand-700 shadow-sm">
                {formatTime(slot)}
              </Link>
            ))}
          </div>
        )
      }
    >
      {week ? (
        <WeekAgenda weekStart={monday} items={items} />
      ) : (
        <div className="space-y-2">
          {items.length === 0 ? <p className={`${cardClass} px-3 py-4 text-sm text-slate-500`}>Rien de posé. Les pastilles au-dessus sont les créneaux encore libres.</p> : null}
          {items.map((item) => (
            <article key={item.id} className={`${cardClass} px-3 py-2`}>
              <p className="text-sm font-semibold text-brand-700">{formatTime(item.starts_at)} – {formatTime(item.ends_at)}</p>
              <p className="font-semibold text-slate-900">{item.status === "blocked" ? item.service_name || "Bloqué" : item.client_name}</p>
              <p className="text-sm text-slate-500">{item.service_name}</p>
            </article>
          ))}
          <details className={`${cardClass} p-3`} open={Boolean(params.heure)}>
            <summary className="cursor-pointer text-sm font-semibold text-slate-900">Ajouter un rendez-vous</summary>
            <form action={createAppointment} className="mt-3 space-y-2">
              <label className={labelClass}>Cliente<input name="name" required list="clientes" className={fieldClass} /></label>
              <datalist id="clientes">{clientList.map((client) => <option key={client.id} value={client.full_name}>{client.phone}</option>)}</datalist>
              <label className={labelClass}>Téléphone<input name="phone" className={fieldClass} placeholder="Si la fiche existe déjà" /></label>
              <label className={labelClass}>Prestation
                <select name="service_id" required className={fieldClass}>{serviceList.map((service) => <option key={service.id} value={service.id}>{service.name}</option>)}</select>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <label className={labelClass}>Date<input type="date" name="date" required defaultValue={day} className={fieldClass} /></label>
                <label className={labelClass}>Heure<input type="time" name="time" required defaultValue={params.heure && /^\d{2}:\d{2}/.test(params.heure) ? params.heure.slice(0, 5) : "10:00"} className={fieldClass} /></label>
              </div>
              <button className="h-11 w-full rounded-2xl grad text-sm font-semibold text-white">Enregistrer</button>
            </form>
          </details>
          <details className={`${cardClass} p-3`}>
            <summary className="cursor-pointer text-sm font-semibold text-slate-900">Bloquer un créneau</summary>
            <form action={createBlock} className="mt-3 space-y-2">
              <label className={labelClass}>Libellé<input name="label" defaultValue="Pause" className={fieldClass} /></label>
              <label className={labelClass}>Date<input type="date" name="date" required defaultValue={day} className={fieldClass} /></label>
              <div className="grid grid-cols-2 gap-2">
                <label className={labelClass}>Début<input type="time" name="start" required defaultValue="12:30" className={fieldClass} /></label>
                <label className={labelClass}>Fin<input type="time" name="end" required defaultValue="13:30" className={fieldClass} /></label>
              </div>
              <button className={`${btnSecondary} w-full`}>Bloquer</button>
            </form>
          </details>
        </div>
      )}
    </ProColumn>
  );
}
