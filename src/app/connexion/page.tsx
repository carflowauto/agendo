import Link from "next/link";
import { LoginForm } from "@/components/auth-forms";
import { Logo, cardClass } from "@/components/ui";

export const metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ suivant?: string; erreur?: string }> }) {
  const params = await searchParams;
  const suivant = params.suivant && params.suivant.startsWith("/") && !params.suivant.startsWith("//") ? params.suivant : "/espace/aujourdhui";
  return (
    <main className="min-h-screen flex items-center justify-center p-5">
      <div className={`${cardClass} w-full max-w-md p-8`}>
        <Logo />
        <h1 className="mt-6 text-2xl font-extrabold text-slate-900">Connexion</h1>
        <p className="mt-1 text-sm text-slate-500">Retrouvez votre espace pro.</p>
        {params.erreur ? <p className="mt-4 rounded-xl bg-rose-50 text-rose-700 text-sm px-4 py-3">{params.erreur}</p> : null}
        <div className="mt-6"><LoginForm suivant={suivant} /></div>
        <p className="mt-4 text-sm text-slate-600">
          <Link href="/mot-de-passe-oublie" className="text-brand-700 font-semibold">Mot de passe oublié</Link>
        </p>
        <p className="mt-2 text-sm text-slate-600">
          Pas encore de compte ? <Link href="/inscription" className="text-brand-700 font-semibold">Créer mon espace</Link>
        </p>
      </div>
    </main>
  );
}
