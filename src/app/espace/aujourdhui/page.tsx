import Link from "next/link";
import { InviteDialog } from "@/components/invite-dialog";
import { ProColumn } from "@/components/pro-shell";
import { ShareCard } from "@/components/share-card";
import { Flash, cardClass } from "@/components/ui";
import { addDays, formatDayLong, formatDuration, formatTime, parisDateKey, zonedWallTimeToUtc } from "@/lib/dates";
import { formatEuro } from "@/lib/money";
import { requestOrigin } from "@/lib/origin";
import { firstName, formatPhone, telHref, waHref } from "@/lib/phone";
import { confirmedCount, dayRevenue, nextAppointment } from "@/lib/today";
import { cancelAppointment, loadDemo } from "@/server/actions";
import { requireProfile } from "@/server/profile";
import type { Appointment, Service } from "@/lib/types";

export const metadata = { title: "Aujourd'hui" };

export default async function TodayPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const params = await searchParams;
  const { supabase, profile } = await requireProfile();
  const today = parisDateKey();
  const start = zonedWallTimeToUtc(today, "00:00", profile.timezone);
  const end = zonedWallTimeToUtc(addDays(today, 1), "00:00", profile.timezone);
  const [{ data: rows }, { data: serviceRows }, { count: hourCount }, { data: pastRows }, { data: futureRows }] = await Promise.all([
    supabase.from("appointments").select("*").eq("profile_id", profile.id).neq("status", "cancelled").gte("starts_at", start.toISOString()).lt("starts_at", end.toISOString()).order("starts_at"),
    supabase.from("services").select("id, name").eq("profile_id", profile.id).eq("active", true).order("sort_order"),
    supabase.from("opening_hours").select("id", { count: "exact", head: true }).eq("profile_id", profile.id),
    supabase.from("appointments").select("*").eq("profile_id", profile.id).eq("status", "confirmed").gte("starts_at", zonedWallTimeToUtc(addDays(addDays(today, -profile.refill_weeks * 7), -1), "00:00", profile.timezone).toISOString()).lt("starts_at", zonedWallTimeToUtc(addDays(addDays(today, -profile.refill_weeks * 7), 2), "00:00", profile.timezone).toISOString()),
    supabase.from("appointments").select("client_id").eq("profile_id", profile.id).eq("status", "confirmed").gte("starts_at", new Date().toISOString()),
  ]);
  const appointments = (rows ?? []) as Appointment[];
  const services = (serviceRows ?? []) as Pick<Service, "id" | "name">[];
  const needsSetup = services.length === 0 || (hourCount ?? 0) === 0;
  const next = nextAppointment(appointments);
  const others = appointments.filter((item) => item.id !== next?.id);
  const futureClients = new Set((futureRows ?? []).map((row) => row.client_id).filter(Boolean));
  const refills = ((pastRows ?? []) as Appointment[]).filter((item) => item.client_id && item.client_phone && !futureClients.has(item.client_id));
  const origin = await requestOrigin();
  const pageUrl = `${origin}/${profile.slug}`;
  const count = confirmedCount(appointments);

  return (
    <ProColumn
      header={
        <div>
          <ShareCard slug={profile.slug} name={profile.full_name} />
          <p className="mt-3 text-sm font-semibold text-brand-700">{formatDayLong(today)}</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Bonjour {profile.full_name}</h1>
          <p className="text-sm text-slate-500">{count === 0 ? "Aucun rendez-vous aujourd’hui" : `${count} rendez-vous · ${formatEuro(dayRevenue(appointments))}`}</p>
          <Flash ok={params.ok} erreur={params.erreur} />
        </div>
      }
      actions={
        <>
          {needsSetup ? (
            <Link href="/espace/reglages/prestations" className="flex items-center justify-between rounded-2xl bg-amber-50 px-3 py-2 text-sm font-medium text-amber-950">
              Ajoute tes prestations et horaires
              <span aria-hidden="true">→</span>
            </Link>
          ) : null}
          {next ? <AppointmentCard item={next} featured pageUrl={pageUrl} /> : null}
          <InviteDialog services={services} className="w-full" />
        </>
      }
    >
      {appointments.length === 0 ? (
        <div className={`${cardClass} px-4 py-6 text-center`}>
          <p className="font-semibold text-slate-900">La journée est libre</p>
          <p className="mt-1 text-sm text-slate-500">Invitez une cliente, ou chargez un exemple pour voir l’espace rempli.</p>
          <form action={loadDemo} className="mt-3">
            <button className="text-sm font-semibold text-brand-700">Charger un exemple</button>
          </form>
        </div>
      ) : (
        <div className="space-y-2">
          {others.map((item) => <AppointmentCard key={item.id} item={item} pageUrl={pageUrl} />)}
          {refills.map((item) => (
            <a key={item.id} href={waHref(item.client_phone ?? "", `Bonjour ${firstName(item.client_name ?? "")}, c’est l’heure du remplissage 💅 On cale un créneau ? ${pageUrl}`)} className={`${cardClass} block px-3 py-2 text-sm`} target="_blank" rel="noreferrer">
              <span className="font-semibold text-slate-900">{item.client_name}</span>
              <span className="mt-0.5 block text-emerald-700">C’est l’heure du remplissage · WhatsApp</span>
            </a>
          ))}
        </div>
      )}
    </ProColumn>
  );
}

function AppointmentCard({ item, featured = false, pageUrl }: { item: Appointment; featured?: boolean; pageUrl: string }) {
  const blocked = item.status === "blocked";
  return (
    <article className={`${cardClass} px-3 py-2.5 ${featured ? "ring-2 ring-brand-300" : ""}`}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-brand-700">{formatTime(item.starts_at)}{featured ? " · Prochain" : ""}</p>
        <p className="text-xs text-slate-500">{blocked ? "Bloqué" : formatDuration(item.duration_min ?? 0)}</p>
      </div>
      <p className="font-semibold text-slate-900">{blocked ? item.service_name || "Indisponible" : item.client_name}</p>
      <p className="text-sm text-slate-500">{blocked ? "Créneau fermé" : `${item.service_name ?? "Rendez-vous"}${item.client_phone ? ` · ${formatPhone(item.client_phone)}` : ""}`}</p>
      {!blocked && item.client_phone ? (
        <div className="mt-2 flex gap-2">
          <a className="h-9 flex-1 inline-flex items-center justify-center rounded-xl bg-white text-sm font-semibold" href={telHref(item.client_phone)}>Appeler</a>
          <a className="h-9 flex-1 inline-flex items-center justify-center rounded-xl bg-emerald-50 text-sm font-semibold text-emerald-800" href={waHref(item.client_phone, `Bonjour ${firstName(item.client_name ?? "")}, je vous confirme notre rendez-vous de ${formatTime(item.starts_at)}. ${pageUrl}`)} target="_blank" rel="noreferrer">WhatsApp</a>
        </div>
      ) : null}
      <form action={cancelAppointment} className="mt-1 text-right">
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="back" value="/espace/aujourdhui" />
        <button className="text-xs font-semibold text-rose-600">Annuler</button>
      </form>
    </article>
  );
}
