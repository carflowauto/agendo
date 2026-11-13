import Link from "next/link";
import { SignupForm } from "@/components/auth-forms";
import { Logo, cardClass } from "@/components/ui";

export const metadata = { title: "Inscription" };

export default function SignupPage() {
  return (
    <main className="min-h-screen px-5 py-10">
      <div className={`${cardClass} max-w-2xl mx-auto p-6 sm:p-8`}>
        <Logo />
        <h1 className="mt-6 text-2xl font-extrabold text-slate-900">Créer mon espace</h1>
        <p className="mt-1 text-sm text-slate-500">Quelques informations, et votre lien de réservation est prêt.</p>
        <div className="mt-6"><SignupForm /></div>
        <p className="mt-4 text-sm text-slate-600">
          Déjà inscrite ? <Link href="/connexion" className="text-brand-700 font-semibold">Se connecter</Link>
        </p>
      </div>
    </main>
  );
}
