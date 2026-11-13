import Link from "next/link";
import { Flash, PageHeader, cardClass } from "@/components/ui";
import { InviteDialog } from "@/components/invite-dialog";
import { addDays, formatDayLong, formatDuration, formatTime, parisDateKey, zonedWallTimeToUtc } from "@/lib/dates";
import { formatEuro } from "@/lib/money";
import { firstName, formatPhone, telHref, waHref } from "@/lib/phone";
import { requestOrigin } from "@/lib/origin";
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
  const { data: rows } = await supabase
    .from("appointments")
    .select("*")
    .eq("profile_id", profile.id)
    .neq("status", "cancelled")
    .gte("starts_at", start.toISOString())
    .lt("starts_at", end.toISOString())
    .order("starts_at");
  const appointments = (rows ?? []) as Appointment[];
  const revenue = appointments.filter((item) => item.status === "confirmed").reduce((sum, item) => sum + (item.price_cents ?? 0), 0);

  const target = addDays(today, -profile.refill_weeks * 7);
  const refillFrom = zonedWallTimeToUtc(addDays(target, -1), "00:00", profile.timezone);
  const refillTo = zonedWallTimeToUtc(addDays(target, 2), "00:00", profile.timezone);
  const { data: pastRows } = await supabase
    .from("appointments")
    .select("*")
    .eq("profile_id", profile.id)
    .eq("status", "confirmed")
    .gte("starts_at", refillFrom.toISOString())
    .lt("starts_at", refillTo.toISOString());
  const { data: futureRows } = await supabase
    .from("appointments")
    .select("client_id")
    .eq("profile_id", profile.id)
    .eq("status", "confirmed")
    .gte("starts_at", new Date().toISOString());
  const futureClients = new Set((futureRows ?? []).map((row) => row.client_id).filter(Boolean));
  const refills = ((pastRows ?? []) as Appointment[]).filter(
    (item) => item.client_id && item.client_phone && !futureClients.has(item.client_id),
  );

  const { data: serviceRows } = await supabase
    .from("services")
    .select("id, name")
    .eq("profile_id", profile.id)
    .eq("active", true)
    .order("sort_order");
  const { data: inviteRows } = await supabase
    .from("invitations")
    .select("id, token, consumed_at, created_at")
    .eq("profile_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(5);

  const origin = await requestOrigin();
  const pageUrl = `${origin}/${profile.slug}`;

  return (
    <div>
      <PageHeader title="Aujourd'hui" subtitle={formatDayLong(today)}>
        <InviteDialog services={(serviceRows ?? []) as Pick<Service, "id" | "name">[]} />
      </PageHeader>
      <Flash ok={params.ok} erreur={params.erreur} />
      <div className="grid lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 space-y-3">
          {appointments.length === 0 ? (
            <div className={`${cardClass} p-8 text-center`}>
              <p className="font-semibold text-slate-900">Aucun rendez-vous aujourd’hui</p>
              <p className="mt-2 text-sm text-slate-500">Chargez un exemple pour voir la journée d’une prothésiste, ou ajoutez un rendez-vous dans l’agenda.</p>
              <form action={loadDemo} className="mt-4">
                <button className="inline-flex h-10 px-4 items-center rounded-xl grad text-white text-sm font-semibold">Charger un exemple de journée</button>
              </form>
            </div>
          ) : (
            appointments.map((item) => (
              <article key={item.id} className={`${cardClass} p-4 flex flex-col sm:flex-row sm:items-center gap-3`}>
                <div className="w-16 text-sm font-semibold text-slate-500">{formatTime(item.starts_at)}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900">{item.status === "blocked" ? item.service_name || "Indisponible" : item.client_name}</p>
                  <p className="text-sm text-slate-500">
                    {item.status === "blocked" ? "Créneau bloqué" : `${item.service_name ?? "Rendez-vous"} · ${formatDuration(item.duration_min ?? 0)}`}
                    {item.client_phone ? ` · ${formatPhone(item.client_phone)}` : ""}
                  </p>
                </div>
                {item.status !== "blocked" && item.client_phone ? (
                  <div className="flex gap-2">
                    <a className="h-9 px-3 inline-flex items-center rounded-lg border border-slate-300 text-sm font-semibold" href={telHref(item.client_phone)}>Appeler</a>
                    <a className="h-9 px-3 inline-flex items-center rounded-lg bg-emerald-50 text-emerald-800 text-sm font-semibold" href={waHref(item.client_phone, `Bonjour ${firstName(item.client_name ?? "")}, je vous confirme notre rendez-vous de ${formatTime(item.starts_at)}.`)} target="_blank" rel="noreferrer">WhatsApp</a>
                    {item.client_id ? <Link className="h-9 px-3 inline-flex items-center rounded-lg text-sm font-semibold text-brand-700" href={`/espace/clientes/${item.client_id}`}>Fiche</Link> : null}
                  </div>
                ) : null}
                <form action={cancelAppointment}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="back" value="/espace/aujourdhui" />
                  <button className="h-9 px-3 text-sm font-semibold text-rose-600">Annuler</button>
                </form>
              </article>
            ))
          )}
        </section>
        <aside className="space-y-4">
          <div className={`${cardClass} p-5`}>
            <p className="text-sm text-slate-500">Chiffre d’affaires du jour</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">{formatEuro(revenue)}</p>
            <p className="mt-1 text-xs text-slate-500">Rendez-vous confirmés, pauses exclues.</p>
          </div>
          <div className={`${cardClass} p-5`}>
            <h2 className="font-bold text-slate-900">C’est l’heure du remplissage</h2>
            <p className="mt-1 text-sm text-slate-500">Poses d’il y a {profile.refill_weeks} semaines, sans rendez-vous à venir.</p>
            <ul className="mt-3 space-y-3">
              {refills.length === 0 ? <li className="text-sm text-slate-500">Aucune relance aujourd’hui.</li> : null}
              {refills.map((item) => {
                const text = `Bonjour ${firstName(item.client_name ?? "")}, c’est l’heure du remplissage 💅 On cale un créneau ? ${pageUrl}`;
                return (
                  <li key={item.id} className="text-sm">
                    <p className="font-semibold text-slate-900">{item.client_name}</p>
                    <a className="text-emerald-700 font-semibold" href={waHref(item.client_phone ?? "", text)} target="_blank" rel="noreferrer">Relancer sur WhatsApp</a>
                  </li>
                );
              })}
            </ul>
          </div>
          {(inviteRows ?? []).length > 0 ? (
            <div className={`${cardClass} p-5`}>
              <h2 className="font-bold text-slate-900">Invitations</h2>
              <ul className="mt-3 space-y-2 text-sm">
                {(inviteRows ?? []).map((invite) => (
                  <li key={invite.id} className="flex items-center justify-between gap-2">
                    <a className="text-brand-700 font-semibold truncate" href={`/invitation/${invite.token}`}>{invite.consumed_at ? "Utilisée" : "En attente"}</a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
