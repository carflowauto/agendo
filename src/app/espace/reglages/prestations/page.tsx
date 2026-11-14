import { ServicesEditor } from "@/components/services-editor";
import { SettingsScreen } from "@/components/settings-screen";
import { requireProfile } from "@/server/profile";
import type { Service } from "@/lib/types";

export const metadata = { title: "Prestations" };

export default async function ServicesPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const params = await searchParams;
  const { supabase, profile } = await requireProfile();
  const { data } = await supabase.from("services").select("*").eq("profile_id", profile.id).order("sort_order");
  return (
    <SettingsScreen title="Prestations" hint="Votre carte, et quelques idées" ok={params.ok} erreur={params.erreur}>
      <ServicesEditor services={(data ?? []) as Service[]} />
    </SettingsScreen>
  );
}
