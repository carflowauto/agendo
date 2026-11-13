import { ProColumn } from "@/components/pro-shell";
import { SettingsRow } from "@/components/settings-screen";
import { Flash } from "@/components/ui";
import { signOut } from "@/server/actions";

export const metadata = { title: "Réglages" };

const ROWS = [
  { href: "/espace/reglages/boutique", title: "Ma boutique", detail: "Enseigne, téléphone, ville, adresse" },
  { href: "/espace/reglages/prestations", title: "Prestations", detail: "Prix, durées et suggestions" },
  { href: "/espace/reglages/horaires", title: "Horaires", detail: "Jours d’ouverture" },
  { href: "/espace/reglages/conges", title: "Congés", detail: "Fermetures exceptionnelles" },
  { href: "/espace/reglages/preferences", title: "Délais et rappels", detail: "Préavis, rappel, remplissage" },
  { href: "/espace/reglages/synchronisation", title: "Synchronisation", detail: "Google Agenda et iPhone" },
  { href: "/espace/reglages/mot-de-passe", title: "Mot de passe", detail: "Accès au compte" },
  { href: "/espace/reglages/exemple", title: "Données d’exemple", detail: "Remplir une journée type" },
];

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const params = await searchParams;
  return (
    <ProColumn
      header={
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">Réglages</h1>
          <p className="text-sm text-slate-500">Votre boutique, en quelques écrans</p>
          <Flash ok={params.ok} erreur={params.erreur} />
        </div>
      }
    >
      <div className="overflow-hidden rounded-[24px] bg-white/80 divide-y divide-slate-100">
        {ROWS.map((row) => <SettingsRow key={row.href} {...row} />)}
      </div>
      <form action={signOut} className="mt-3 overflow-hidden rounded-[24px] bg-white/80">
        <button className="h-12 w-full text-sm font-semibold text-rose-600">Déconnexion</button>
      </form>
    </ProColumn>
  );
}
