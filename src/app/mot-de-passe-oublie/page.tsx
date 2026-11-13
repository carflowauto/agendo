import Link from "next/link";
import { ForgotForm } from "@/components/auth-forms";
import { Logo, cardClass } from "@/components/ui";

export const metadata = { title: "Mot de passe oublié" };

export default function ForgotPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-5">
      <div className={`${cardClass} w-full max-w-md p-8`}>
        <Logo />
        <h1 className="mt-6 text-2xl font-extrabold text-slate-900">Mot de passe oublié</h1>
        <div className="mt-6"><ForgotForm /></div>
        <p className="mt-4 text-sm"><Link href="/connexion" className="text-brand-700 font-semibold">Retour à la connexion</Link></p>
      </div>
    </main>
  );
}
