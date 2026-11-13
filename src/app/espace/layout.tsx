import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ProShell } from "@/components/pro-shell";
import { btnSecondary } from "@/components/ui";
import { signOut } from "@/server/actions";
import { getSessionProfile } from "@/server/profile";

export default async function EspaceLayout({ children }: { children: ReactNode }) {
  const { user, profile, configError } = await getSessionProfile();
  if (!user) redirect("/connexion");
  if (!profile) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg bg-white border border-slate-200 rounded-2xl p-8">
          <h1 className="text-xl font-bold text-slate-900">Profil introuvable</h1>
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            {configError ??
              "Le compte existe, mais la fiche pro n’a pas été créée. Dans Supabase, ouvrez le SQL Editor et exécutez supabase/migrations/20261113120000_init.sql, puis reconnectez-vous."}
          </p>
          <form action={signOut} className="mt-6">
            <button className={btnSecondary}>Se déconnecter</button>
          </form>
        </div>
      </main>
    );
  }
  return (
    <ProShell profile={profile} email={user.email ?? ""}>
      {children}
    </ProShell>
  );
}
