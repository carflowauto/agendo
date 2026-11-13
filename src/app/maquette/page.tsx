import Link from "next/link";

export const metadata = { title: "Maquette" };

export default function MaquettePage() {
  return (
    <main className="max-w-xl mx-auto px-5 py-16">
      <h1 className="text-2xl font-extrabold text-slate-900">Maquette de design</h1>
      <p className="mt-3 text-slate-600">
        La maquette HTML statique est dans le dossier <code>/maquette</code> du dépôt. Elle est publiée à part sur GitHub Pages, pour ne pas mélanger le design de référence et l’application.
      </p>
      <a href="https://carflowauto.github.io/agendo/" className="mt-6 inline-flex h-10 px-4 items-center rounded-xl grad text-white text-sm font-semibold">
        Ouvrir la maquette
      </a>
      <p className="mt-6 text-sm"><Link href="/" className="text-brand-700 font-semibold">Retour à l’accueil</Link></p>
    </main>
  );
}
