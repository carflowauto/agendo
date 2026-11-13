import { PasswordForm } from "@/components/auth-forms";
import { SettingsScreen } from "@/components/settings-screen";

export const metadata = { title: "Mot de passe" };

export default async function PasswordPage({ searchParams }: { searchParams: Promise<{ ok?: string; erreur?: string }> }) {
  const params = await searchParams;
  return (
    <SettingsScreen title="Mot de passe" ok={params.ok} erreur={params.erreur}>
      <PasswordForm />
    </SettingsScreen>
  );
}
