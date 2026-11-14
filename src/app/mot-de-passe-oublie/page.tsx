import Link from "next/link";
import { ForgotForm } from "@/components/auth-forms";
import { AuthShell } from "@/components/auth-shell";

export const metadata = { title: "Mot de passe oublié" };

export default function ForgotPage() {
  return (
    <AuthShell>
      <h1 className="text-[34px] font-extrabold leading-tight tracking-tight text-[#3B1230]">Mot de passe oublié</h1>
      <p className="mt-2 text-[16px] text-[#8E7F87]">Nous vous envoyons un lien pour le choisir à nouveau.</p>
      <ForgotForm />
      <p className="mt-5 text-center">
        <Link href="/connexion" className="text-[15px] font-semibold text-[#E23B6E]">Retour à la connexion</Link>
      </p>
    </AuthShell>
  );
}
