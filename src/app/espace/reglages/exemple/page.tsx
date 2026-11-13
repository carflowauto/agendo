import { SettingsScreen } from "@/components/settings-screen";
import { loadDemo } from "@/server/actions";

export const metadata = { title: "Données d’exemple" };

export default async function DemoPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const params = await searchParams;
  return (
    <SettingsScreen title="Données d’exemple" hint="Une journée type, que vous pouvez recharger" ok={params.ok} erreur={params.erreur}>
      <form action={loadDemo}>
        <button className="h-11 w-full rounded-2xl grad text-sm font-semibold text-white">Charger un exemple</button>
      </form>
    </SettingsScreen>
  );
}
