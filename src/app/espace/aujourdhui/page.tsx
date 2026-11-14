import { TodayDashboard, type TodayRow } from "@/components/today-dashboard";
import { addDays, formatDayLong, formatTime, parisDateKey, zonedWallTimeToUtc } from "@/lib/dates";
import { firstName, smsHref, waHref } from "@/lib/phone";
import { hourForDate } from "@/lib/slots";
import { mapsSearchUrl, vitrineUrl } from "@/lib/storefront";
import { confirmedCount, dayRevenue, freeGaps, nextAppointment, type FreeGap } from "@/lib/today";
import { loadDemo } from "@/server/actions";
import { requireProfile } from "@/server/profile";
import type { Appointment, OpeningHour } from "@/lib/types";

export const metadata = { title: "Aujourd'hui" };

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const params = await searchParams;
  const { supabase, profile } = await requireProfile();
  const today = parisDateKey();
  const zone = profile.timezone || "Europe/Paris";
  const start = zonedWallTimeToUtc(today, "00:00", zone);
  const yesterday = addDays(today, -1);
  const yStart = zonedWallTimeToUtc(yesterday, "00:00", zone);
  const end = zonedWallTimeToUtc(addDays(today, 1), "00:00", zone);
  const [{ data: rows }, { data: yRows }, { data: serviceRows }, { data: hourRows }, { data: offRows }, { data: pastRows }, { data: futureRows }] = await Promise.all([
    supabase.from("appointments").select("*").eq("profile_id", profile.id).neq("status", "cancelled").gte("starts_at", start.toISOString()).lt("starts_at", end.toISOString()).order("starts_at"),
    supabase.from("appointments").select("status, price_cents").eq("profile_id", profile.id).gte("starts_at", yStart.toISOString()).lt("starts_at", start.toISOString()),
    supabase.from("services").select("id").eq("profile_id", profile.id).eq("active", true),
    supabase.from("opening_hours").select("*").eq("profile_id", profile.id),
    supabase.from("time_off").select("starts_on, ends_on").eq("profile_id", profile.id),
    supabase.from("appointments").select("*").eq("profile_id", profile.id).eq("status", "confirmed").gte("starts_at", zonedWallTimeToUtc(addDays(addDays(today, -profile.refill_weeks * 7), -1), "00:00", zone).toISOString()).lt("starts_at", zonedWallTimeToUtc(addDays(addDays(today, -profile.refill_weeks * 7), 2), "00:00", zone).toISOString()),
    supabase.from("appointments").select("client_id").eq("profile_id", profile.id).eq("status", "confirmed").gte("starts_at", new Date().toISOString()),
  ]);
  const appointments = (rows ?? []) as Appointment[];
  const hours = (hourRows ?? []) as OpeningHour[];
  const timeOff = (offRows ?? []) as { starts_on: string; ends_on: string }[];
  const hour = hourForDate(hours, today);
  const off = timeOff.some((item) => today >= item.starts_on && today <= item.ends_on);
  const gaps = freeToday(today, zone, hour, off, appointments);
  const next = nextAppointment(appointments);
  const revenue = dayRevenue(appointments);
  const previous = dayRevenue((yRows ?? []) as { status: string; price_cents: number | null }[]);
  const futureClients = new Set((futureRows ?? []).map((row) => row.client_id).filter(Boolean));
  const refills = ((pastRows ?? []) as Appointment[]).filter((item) => item.client_id && item.client_phone && !futureClients.has(item.client_id));
  const pageUrl = vitrineUrl(profile.slug);
  const maps = mapsSearchUrl(profile.address, profile.city);
  const rowsView = programmeRows(appointments, gaps ?? [], next?.id ?? null);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <TodayDashboard
        dateLabel={formatDayLong(today)}
        slug={profile.slug}
        count={confirmedCount(appointments)}
        revenue={euroShort(revenue)}
        trend={revenue > previous ? "up" : revenue < previous ? "down" : "flat"}
        free={gaps ? String(gaps.length) : "–"}
        next={next ? {
          time: formatTime(next.starts_at),
          line: nextLine(next),
          phone: next.client_phone,
          maps,
          sms: next.client_phone ? smsHref(next.client_phone, `Bonjour ${firstName(next.client_name ?? "")}, je vous confirme le rendez-vous de ${formatTime(next.starts_at)}.`) : null,
        } : null}
        rows={rowsView}
        empty={appointments.length === 0 && rowsView.length === 0}
        needsSetup={(serviceRows ?? []).length === 0 || hours.length === 0}
        ok={params.ok}
        erreur={params.erreur}
        agendaHref={`/espace/agenda?jour=${today}&ajout=1`}
      />
      {appointments.length === 0 && rowsView.length === 0 ? (
        <form action={loadDemo} className="px-4 pb-2 text-center">
          <button className="text-sm font-semibold text-[#D9577A]">Charger un exemple</button>
        </form>
      ) : null}
      {refills.length > 0 ? (
        <div className="space-y-1 px-4 pb-2">
          {refills.map((item) => (
            <a key={item.id} href={waHref(item.client_phone ?? "", `Bonjour ${firstName(item.client_name ?? "")}, on cale un créneau ? ${pageUrl}`)} className="block text-sm font-semibold text-[#D9577A]" target="_blank" rel="noreferrer">
              Relancer {item.client_name}
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function euroShort(cents: number) {
  if (cents % 100 === 0) return `${cents / 100} €`;
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(cents / 100);
}

function durShort(min: number) {
  const hours = Math.floor(min / 60);
  const minutes = min % 60;
  if (hours && minutes) return `${hours}h${minutes}`;
  if (hours) return `${hours}h`;
  return `${minutes} min`;
}

function minutesOf(item: Appointment) {
  if (item.duration_min && item.duration_min > 0) return item.duration_min;
  return Math.max(15, Math.round((new Date(item.ends_at).getTime() - new Date(item.starts_at).getTime()) / 60_000));
}

function shortName(name: string | null) {
  if (!name?.trim()) return "Cliente";
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[1][0]?.toUpperCase()}.`;
}

function nextLine(item: Appointment) {
  const bits = [formatTime(item.starts_at), shortName(item.client_name), item.service_name || "Rendez-vous", durShort(minutesOf(item))];
  if (item.price_cents) bits.push(euroShort(item.price_cents));
  return bits.join(" · ");
}

function badge(item: Appointment) {
  const duration = durShort(minutesOf(item));
  if (item.status === "blocked" || !item.price_cents) return duration;
  return `${duration} · ${euroShort(item.price_cents)}`;
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

function programmeRows(appointments: Appointment[], gaps: FreeGap[], nextId: string | null): TodayRow[] {
  return [
    ...appointments.map((item) => ({
      kind: "rdv" as const,
      id: item.id,
      time: formatTime(item.starts_at),
      name: item.status === "blocked" ? item.service_name || "Indisponible" : shortName(item.client_name),
      service: item.status === "blocked" ? "Créneau fermé" : item.service_name || "Rendez-vous",
      badge: badge(item),
      highlighted: item.id === nextId,
      blocked: item.status === "blocked",
      at: item.starts_at,
    })),
    ...gaps.map((gap) => ({ kind: "gap" as const, id: `${gap.starts_at}-libre`, time: formatTime(gap.starts_at), at: gap.starts_at })),
  ]
    .sort((a, b) => +new Date(a.at) - +new Date(b.at))
    .map(({ at: _at, ...row }) => row);
}
