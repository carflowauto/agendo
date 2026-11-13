import { HoursEditor } from "@/components/offer-settings";
import { SettingsScreen } from "@/components/settings-screen";
import { requireProfile } from "@/server/profile";
import type { OpeningHour } from "@/lib/types";

export const metadata = { title: "Horaires" };

export default async function HoursPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const params = await searchParams;
  const { supabase, profile } = await requireProfile();
  const { data } = await supabase.from("opening_hours").select("*").eq("profile_id", profile.id).order("isodow");
  return (
    <SettingsScreen title="Horaires" hint="Les créneaux proposés sur votre page" ok={params.ok} erreur={params.erreur}>
      <HoursEditor hours={(data ?? []) as OpeningHour[]} />
    </SettingsScreen>
  );
}
