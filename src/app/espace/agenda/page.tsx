import { AgendaScreen } from "@/components/agenda-screen";
import { addDays, isDateKey, mondayOf, parisDateKey, zonedWallTimeToUtc } from "@/lib/dates";
import { requireProfile } from "@/server/profile";
import type { Appointment, ClientRow, Service } from "@/lib/types";

export const metadata = { title: "Agenda" };

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ jour?: string; vue?: string; semaine?: string; ok?: string; erreur?: string; ajout?: string }> }) {
  const params = await searchParams;
  const { supabase, profile } = await requireProfile();
  const today = parisDateKey();
  const requested = params.jour && isDateKey(params.jour) ? params.jour : params.semaine && isDateKey(params.semaine) ? params.semaine : today;
  const day = isDateKey(requested) ? requested : today;
  const week = params.vue === "semaine";
  const monday = mondayOf(day);
  const from = zonedWallTimeToUtc(monday, "00:00", profile.timezone);
  const to = zonedWallTimeToUtc(addDays(monday, 7), "00:00", profile.timezone);
  const [{ data: rows }, { data: services }, { data: clients }] = await Promise.all([
    supabase.from("appointments").select("*").eq("profile_id", profile.id).neq("status", "cancelled").lt("starts_at", to.toISOString()).gt("ends_at", from.toISOString()).order("starts_at"),
    supabase.from("services").select("id, name").eq("profile_id", profile.id).eq("active", true).order("sort_order"),
    supabase.from("clients").select("id, full_name, phone").eq("profile_id", profile.id).order("full_name"),
  ]);

  return (
    <AgendaScreen
      day={day}
      today={today}
      week={week}
      items={(rows ?? []) as Appointment[]}
      services={(services ?? []) as Pick<Service, "id" | "name">[]}
      clients={(clients ?? []) as Pick<ClientRow, "id" | "full_name" | "phone">[]}
      ok={params.ok}
      erreur={params.erreur}
      openAdd={params.ajout === "1"}
    />
  );
}
