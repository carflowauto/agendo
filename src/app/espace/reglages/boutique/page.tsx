import { SettingsScreen } from "@/components/settings-screen";
import { fieldClass, labelClass } from "@/components/ui";
import { saveBoutique } from "@/server/actions";
import { requireProfile } from "@/server/profile";

export const metadata = { title: "Ma boutique" };

export default async function BoutiquePage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const params = await searchParams;
  const { profile } = await requireProfile();
  return (
    <SettingsScreen title="Ma boutique" hint="Ce que vos clientes voient" ok={params.ok} erreur={params.erreur}>
      <form action={saveBoutique} className="space-y-3">
        <label className={labelClass}>Nom de l’enseigne<input name="full_name" required defaultValue={profile.full_name} className={fieldClass} /></label>
        <label className={labelClass}>Numéro de téléphone<input name="phone" required defaultValue={profile.phone} inputMode="tel" className={fieldClass} /></label>
        <label className={labelClass}>Ville<input name="city" required defaultValue={profile.city} className={fieldClass} /></label>
        <label className={labelClass}>Adresse<input name="address" defaultValue={profile.address ?? ""} placeholder="12 rue des Fleurs" className={fieldClass} /></label>
        <button className="h-11 w-full rounded-2xl grad text-sm font-semibold text-white">Enregistrer</button>
      </form>
    </SettingsScreen>
  );
}
