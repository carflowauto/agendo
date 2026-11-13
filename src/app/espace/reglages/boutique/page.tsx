import { BoutiqueGallery } from "@/components/boutique-photos";
import { SettingsScreen } from "@/components/settings-screen";
import { fieldClass, labelClass } from "@/components/ui";
import { saveBoutique } from "@/server/actions";
import { requireProfile } from "@/server/profile";
import type { Photo } from "@/lib/types";

export const metadata = { title: "Ma boutique" };

export default async function BoutiquePage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const params = await searchParams;
  const { profile, supabase } = await requireProfile();
  const { data: photos } = await supabase.from("photos").select("*").eq("profile_id", profile.id).order("sort_order").order("created_at");
  return (
    <SettingsScreen title="Ma boutique" hint="Ce que vos clientes voient" ok={params.ok} erreur={params.erreur}>
      <form action={saveBoutique} className="space-y-3">
        <label className={labelClass}>Nom de l’enseigne<input name="full_name" required defaultValue={profile.full_name} className={fieldClass} /></label>
        <label className={labelClass}>Numéro de téléphone<input name="phone" required defaultValue={profile.phone} inputMode="tel" className={fieldClass} /></label>
        <label className={labelClass}>Ville<input name="city" required defaultValue={profile.city} className={fieldClass} /></label>
        <label className={labelClass}>Adresse<input name="address" defaultValue={profile.address ?? ""} placeholder="12 rue des Fleurs" className={fieldClass} /></label>
        <label className={labelClass}>Description courte<textarea name="bio" rows={3} defaultValue={profile.bio ?? ""} placeholder="Quelques mots sur votre univers…" className="mt-1 w-full rounded-2xl border border-white/80 bg-white px-3 py-2 text-sm" /></label>
        <button className="h-11 w-full rounded-2xl grad text-sm font-semibold text-white">Enregistrer</button>
      </form>
      <BoutiqueGallery photos={(photos ?? []) as Photo[]} userId={profile.id} />
    </SettingsScreen>
  );
}
