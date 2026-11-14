import Link from "next/link";
import { LoginForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata = { title: "Connexion" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ suivant?: string; erreur?: string }> }) {
  const params = await searchParams;
  const suivant = params.suivant && params.suivant.startsWith("/") && !params.suivant.startsWith("//") ? params.suivant : "/espace/aujourdhui";
  return (
    <AuthShell>
      <h1 className="text-[40px] font-extrabold leading-none tracking-tight text-[#3B1230]">Connexion</h1>
      <p className="mt-2 text-[16px] text-[#8E7F87]">Retrouvez votre espace pro.</p>
      {params.erreur ? <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{params.erreur}</p> : null}
      <LoginForm suivant={suivant} />
      <p className="mt-5 text-center text-[15px] text-[#8E7F87]">Pas encore de compte ?</p>
      <Link href="/inscription" className="mt-3 flex h-12 w-full items-center justify-center rounded-2xl border border-[#E23B6E] bg-white text-[16px] font-semibold text-[#E23B6E]">
        Créer mon espace
      </Link>
    </AuthShell>
  );
}
