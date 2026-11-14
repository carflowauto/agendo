import Link from "next/link";
import { Logo } from "@/components/ui";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center">
        <div className="flex justify-center"><Logo /></div>
        <h1 className="mt-8 text-2xl font-extrabold text-slate-900">Page introuvable</h1>
        <p className="mt-2 text-slate-600">Ce lien ne correspond à aucune page Sheensy.</p>
        <Link href="/" className="mt-6 inline-flex h-10 px-4 items-center rounded-xl grad text-white text-sm font-semibold">Retour à l’accueil</Link>
      </div>
    </main>
  );
}
