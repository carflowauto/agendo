import { AgendaScreen } from "@/components/agenda-screen";
import { addDays, parisDateKey, zonedWallTimeToUtc } from "@/lib/dates";
import { requireProfile } from "@/server/profile";
import type { Appointment, ClientRow, Service } from "@/lib/types";

export const metadata = { title: "Agenda" };

export default async function AgendaPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string; ajout?: string }> }) {
  const params = await searchParams;
  const { supabase, profile } = await requireProfile();
  const today = parisDateKey();
  const from = zonedWallTimeToUtc(today, "00:00", profile.timezone);
  const to = zonedWallTimeToUtc(addDays(today, 14), "00:00", profile.timezone);
  const [{ data: rows }, { data: services }, { data: clients }] = await Promise.all([
    supabase.from("appointments").select("*").eq("profile_id", profile.id).neq("status", "cancelled").lt("starts_at", to.toISOString()).gt("ends_at", from.toISOString()).order("starts_at"),
    supabase.from("services").select("id, name").eq("profile_id", profile.id).eq("active", true).order("sort_order"),
    supabase.from("clients").select("id, full_name, phone").eq("profile_id", profile.id).order("full_name"),
  ]);

  return (
    <AgendaScreen
      today={today}
      items={(rows ?? []) as Appointment[]}
      services={(services ?? []) as Pick<Service, "id" | "name">[]}
      clients={(clients ?? []) as Pick<ClientRow, "id" | "full_name" | "phone">[]}
      ok={params.ok}
      erreur={params.erreur}
      openAdd={params.ajout === "1"}
    />
  );
}
