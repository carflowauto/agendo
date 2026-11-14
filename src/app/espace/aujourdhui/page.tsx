import Link from "next/link";
import { InviteDialog } from "@/components/invite-dialog";
import { VitrineBar } from "@/components/vitrine-bar";
import { Flash } from "@/components/ui";
import { addDays, formatDayLong, formatDuration, formatTime, parisDateKey, zonedWallTimeToUtc } from "@/lib/dates";
import { formatEuro } from "@/lib/money";
import { firstName, initials, smsHref, telHref, waHref } from "@/lib/phone";
import { hourForDate } from "@/lib/slots";
import { vitrineUrl } from "@/lib/storefront";
import { confirmedCount, dayRevenue, freeGaps, nextAppointment, type FreeGap } from "@/lib/today";
import { cancelAppointment, loadDemo } from "@/server/actions";
import { requireProfile } from "@/server/profile";
import type { Appointment, OpeningHour, Service } from "@/lib/types";

export const metadata = { title: "Aujourd'hui" };

const plum = "text-[#4a1942]";

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const params = await searchParams;
  const { supabase, profile } = await requireProfile();
  const today = parisDateKey();
  const zone = profile.timezone || "Europe/Paris";
  const start = zonedWallTimeToUtc(today, "00:00", zone);
  const end = zonedWallTimeToUtc(addDays(today, 1), "00:00", zone);
  const [{ data: rows }, { data: serviceRows }, { data: hourRows }, { data: offRows }, { data: pastRows }, { data: futureRows }] = await Promise.all([
    supabase.from("appointments").select("*").eq("profile_id", profile.id).neq("status", "cancelled").gte("starts_at", start.toISOString()).lt("starts_at", end.toISOString()).order("starts_at"),
    supabase.from("services").select("id, name").eq("profile_id", profile.id).eq("active", true).order("sort_order"),
    supabase.from("opening_hours").select("*").eq("profile_id", profile.id),
    supabase.from("time_off").select("starts_on, ends_on").eq("profile_id", profile.id),
    supabase.from("appointments").select("*").eq("profile_id", profile.id).eq("status", "confirmed").gte("starts_at", zonedWallTimeToUtc(addDays(addDays(today, -profile.refill_weeks * 7), -1), "00:00", zone).toISOString()).lt("starts_at", zonedWallTimeToUtc(addDays(addDays(today, -profile.refill_weeks * 7), 2), "00:00", zone).toISOString()),
    supabase.from("appointments").select("client_id").eq("profile_id", profile.id).eq("status", "confirmed").gte("starts_at", new Date().toISOString()),
  ]);
  const appointments = (rows ?? []) as Appointment[];
  const services = (serviceRows ?? []) as Pick<Service, "id" | "name">[];
  const hours = (hourRows ?? []) as OpeningHour[];
  const timeOff = (offRows ?? []) as { starts_on: string; ends_on: string }[];
  const hour = hourForDate(hours, today);
  const off = timeOff.some((item) => today >= item.starts_on && today <= item.ends_on);
  const gaps = freeToday(today, zone, hour, off, appointments);
  const needsSetup = services.length === 0 || hours.length === 0;
  const next = nextAppointment(appointments);
  const futureClients = new Set((futureRows ?? []).map((row) => row.client_id).filter(Boolean));
  const refills = ((pastRows ?? []) as Appointment[]).filter((item) => item.client_id && item.client_phone && !futureClients.has(item.client_id));
  const pageUrl = vitrineUrl(profile.slug);
  const count = confirmedCount(appointments);
  const revenue = dayRevenue(appointments);
  const stats = [
    { label: "RDV", value: String(count) },
    { label: "Chiffre", value: formatEuro(revenue) },
    ...(gaps ? [{ label: "Libres", value: String(gaps.length) }] : []),
  ];
  const programme = programmeRows(appointments, gaps ?? []);

  return (
    <div className={`relative flex h-full min-h-0 flex-col bg-white ${plum}`}>
      <header className="shrink-0 px-4 pb-3 pt-4">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xl font-extrabold tracking-tight">Sheensy</p>
            <h1 className="mt-1 truncate text-lg font-bold">Bonjour {profile.full_name}</h1>
            <p className="text-sm text-rose-400">{formatDayLong(today)}</p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-rose-100 text-sm font-bold" aria-hidden="true">{initials(profile.full_name)}</span>
        </div>
        <div className={`mt-3 grid gap-2 ${stats.length === 3 ? "grid-cols-3" : "grid-cols-2"}`}>
          {stats.map((stat) => (
            <article key={stat.label} className="rounded-2xl bg-white px-2 py-2.5 text-center shadow-[0_8px_24px_rgba(74,25,66,0.06)] ring-1 ring-rose-50">
              <p className="truncate text-lg font-extrabold leading-tight">{stat.value}</p>
              <p className="mt-0.5 text-[11px] font-medium text-rose-400">{stat.label}</p>
            </article>
          ))}
        </div>
      </header>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-20">
        <Flash ok={params.ok} erreur={params.erreur} />
        {needsSetup ? (
          <Link href="/espace/reglages/prestations" className="flex items-center justify-between rounded-2xl bg-rose-50 px-3 py-2 text-sm font-medium">
            Ajoute tes prestations et horaires
            <span aria-hidden="true">→</span>
          </Link>
        ) : null}
        {next ? <NextCard item={next} /> : null}
        <section>
          <h2 className="text-sm font-bold">Programme du jour</h2>
          {appointments.length === 0 && programme.length === 0 ? (
            <div className="mt-2 rounded-2xl bg-rose-50/60 px-4 py-6 text-center">
              <p className="font-semibold">Aucun rendez-vous aujourd’hui</p>
              <form action={loadDemo} className="mt-3">
                <button className="text-sm font-semibold text-rose-500">Charger un exemple</button>
              </form>
            </div>
          ) : (
            <ol className="mt-2 space-y-2">
              {appointments.length === 0 ? <li className="text-sm text-rose-400">Aucun rendez-vous aujourd’hui</li> : null}
              {programme.map((row) => row.kind === "gap" ? (
                <li key={`${row.starts_at}-libre`} className="flex gap-2">
                  <p className="w-12 shrink-0 pt-3 text-xs font-semibold text-rose-300">{formatTime(row.starts_at)}</p>
                  <p className="flex-1 rounded-2xl border border-dashed border-rose-200 bg-rose-50/50 px-3 py-3 text-sm text-rose-400">Libre · Créneau disponible</p>
                </li>
              ) : (
                <li key={row.item.id}><TimelineCard item={row.item} /></li>
              ))}
            </ol>
          )}
        </section>
        {refills.length > 0 ? (
          <section className="space-y-2">
            <h2 className="text-sm font-bold">À relancer</h2>
            {refills.map((item) => (
              <a key={item.id} href={waHref(item.client_phone ?? "", `Bonjour ${firstName(item.client_name ?? "")}, on cale un créneau ? ${pageUrl}`)} className="block rounded-2xl bg-white px-3 py-2 text-sm shadow-[0_8px_24px_rgba(74,25,66,0.06)] ring-1 ring-rose-50" target="_blank" rel="noreferrer">
                <span className="font-semibold">{item.client_name}</span>
                <span className="mt-0.5 block text-rose-400">WhatsApp</span>
              </a>
            ))}
          </section>
        ) : null}
        <VitrineBar slug={profile.slug} embedded />
        {services.length > 0 ? <InviteDialog services={services} className="flex h-11 w-full items-center justify-center rounded-2xl bg-rose-50 text-sm font-semibold text-[#4a1942]" /> : null}
      </div>
      <Link href={`/espace/agenda?jour=${today}&ajout=1`} className="absolute bottom-3 right-3 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#4a1942] text-3xl font-light leading-none text-white shadow-lg shadow-rose-200" aria-label="Ajouter un rendez-vous">+</Link>
    </div>
  );
}

function freeToday(
  today: string,
  zone: string,
  hour: Pick<OpeningHour, "opens" | "closes" | "is_closed"> | null,
  off: boolean,
  appointments: Appointment[],
): FreeGap[] | null {
  if (!hour && !off) return null;
  if (off || !hour || hour.is_closed || !hour.opens || !hour.closes) return [];
  return freeGaps({
    open: zonedWallTimeToUtc(today, hour.opens.slice(0, 5), zone).toISOString(),
    close: zonedWallTimeToUtc(today, hour.closes.slice(0, 5), zone).toISOString(),
    busy: appointments.map((item) => ({ starts_at: item.starts_at, ends_at: item.ends_at })),
    now: new Date(),
  });
}

function programmeRows(appointments: Appointment[], gaps: FreeGap[]) {
  return [
    ...appointments.map((item) => ({ kind: "rdv" as const, item, at: item.starts_at })),
    ...gaps.map((gap) => ({ kind: "gap" as const, ...gap, at: gap.starts_at })),
  ].sort((a, b) => +new Date(a.at) - +new Date(b.at));
}

function NextCard({ item }: { item: Appointment }) {
  const minutes = item.duration_min ?? Math.max(15, Math.round((new Date(item.ends_at).getTime() - new Date(item.starts_at).getTime()) / 60_000));
  return (
    <section className="rounded-3xl bg-gradient-to-br from-rose-50 to-white p-4 shadow-[0_10px_30px_rgba(74,25,66,0.08)] ring-1 ring-rose-100">
      <p className="text-xs font-semibold uppercase tracking-wide text-rose-400">Prochain rendez-vous</p>
      <p className="mt-1 text-lg font-extrabold">{formatTime(item.starts_at)} · {item.client_name}</p>
      <p className="text-sm text-rose-400">{item.service_name || "Rendez-vous"} · {formatDuration(minutes)}{item.price_cents ? ` · ${formatEuro(item.price_cents)}` : ""}</p>
      {item.client_phone ? (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <a href={telHref(item.client_phone)} className="flex h-10 items-center justify-center rounded-2xl bg-[#4a1942] text-sm font-semibold text-white">Appeler</a>
          <a href={smsHref(item.client_phone, `Bonjour ${firstName(item.client_name ?? "")}, je vous confirme le rendez-vous de ${formatTime(item.starts_at)}.`)} className="flex h-10 items-center justify-center rounded-2xl bg-white text-sm font-semibold ring-1 ring-rose-100">SMS</a>
        </div>
      ) : null}
    </section>
  );
}

function TimelineCard({ item }: { item: Appointment }) {
  const blocked = item.status === "blocked";
  const minutes = item.duration_min ?? Math.max(15, Math.round((new Date(item.ends_at).getTime() - new Date(item.starts_at).getTime()) / 60_000));
  return (
    <div className="flex gap-2">
      <p className="w-12 shrink-0 pt-3 text-xs font-semibold">{formatTime(item.starts_at)}</p>
      <article className="min-w-0 flex-1 rounded-2xl bg-white px-3 py-2.5 shadow-[0_8px_24px_rgba(74,25,66,0.06)] ring-1 ring-rose-50">
        <div className="flex items-start gap-2">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-rose-50 text-rose-400" aria-hidden="true">
            <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
              <rect x="4" y="5" width="16" height="15" rx="2" />
              <path strokeLinecap="round" d="M8 3v4M16 3v4M4 10h16" />
            </svg>
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{blocked ? item.service_name || "Indisponible" : item.client_name}</p>
            <p className="truncate text-sm text-rose-400">{blocked ? "Créneau fermé" : item.service_name || "Rendez-vous"}</p>
            <p className="mt-1 inline-flex rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-semibold text-rose-500">{blocked ? formatDuration(minutes) : `${formatDuration(minutes)}${item.price_cents ? ` · ${formatEuro(item.price_cents)}` : ""}`}</p>
          </div>
        </div>
        <form action={cancelAppointment} className="mt-1 text-right">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="back" value="/espace/aujourdhui" />
          <button className="text-xs font-semibold text-rose-500">{blocked ? "Retirer" : "Annuler"}</button>
        </form>
      </article>
    </div>
  );
}
