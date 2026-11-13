import Link from "next/link";
import { Logo } from "@/components/ui";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="sticky top-0 z-30 bg-white/85 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-5 h-16 flex items-center gap-4">
          <Logo />
          <div className="ml-auto flex items-center gap-2">
            <Link href="/connexion" className="px-4 h-10 inline-flex items-center text-sm font-semibold text-slate-700">Connexion</Link>
            <Link href="/inscription" className="inline-flex px-4 h-10 items-center rounded-xl grad text-white text-sm font-semibold shadow-md shadow-brand-500/25">Créer mon espace</Link>
          </div>
        </div>
      </header>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-50/80 via-white to-white" />
        <div className="max-w-6xl mx-auto px-5 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="inline-flex text-xs font-semibold text-brand-700 bg-white border border-brand-200 rounded-full px-3 py-1.5">Pour les prothésistes ongulaires</p>
            <h1 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.05]">
              Vos clientes réservent en ligne <span className="grad-text">24h/24</span>
            </h1>
            <p className="mt-6 text-lg text-slate-600 max-w-xl">
              Agendo est l’espace pro pour gérer la journée, l’agenda, les fiches clientes et la page de réservation. Un lien, un QR code, des créneaux qui se remplissent tout seuls.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link href="/inscription" className="inline-flex justify-center items-center px-6 h-12 rounded-xl grad text-white font-semibold shadow-lg shadow-brand-500/30">Créer mon espace gratuitement</Link>
              <Link href="/connexion" className="inline-flex justify-center items-center px-6 h-12 rounded-xl border border-slate-300 bg-white font-semibold">J’ai déjà un compte</Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">Inscription en trois étapes · enseigne, ville, accès.</p>
          </div>
          <div className="bg-white rounded-2xl shadow-2xl shadow-brand-900/10 border border-slate-200 p-5">
            <p className="text-xs text-slate-500">Aujourd’hui</p>
            <p className="font-bold text-slate-900">Trois rendez-vous, le chiffre d’affaires sous les yeux</p>
            <div className="mt-4 space-y-2">
              <div className="rounded-lg bg-brand-50 border-l-4 border-brand-500 px-3 py-2">
                <p className="text-sm font-semibold text-brand-900">Camille Durand</p>
                <p className="text-xs text-brand-700">Pose complète · 09:30</p>
              </div>
              <div className="rounded-lg bg-violet-50 border-l-4 border-violet-500 px-3 py-2">
                <p className="text-sm font-semibold text-violet-900">Léa Martin</p>
                <p className="text-xs text-violet-700">Remplissage · 14:00</p>
              </div>
              <div className="rounded-lg border border-dashed border-slate-300 px-3 py-2">
                <p className="text-sm font-semibold text-slate-600">Pause déjeuner</p>
                <p className="text-xs text-slate-500">Créneau bloqué</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="max-w-6xl mx-auto px-5 pb-20 grid sm:grid-cols-3 gap-4">
        {[
          ["Aujourd’hui", "Les rendez-vous du jour, l’appel, WhatsApp et le chiffre d’affaires."],
          ["Votre lien", "Une page vitrine avec prestations, créneaux libres et QR code."],
          ["Relances", "« C’est l’heure du remplissage », quelques semaines après la pose."],
        ].map(([title, text]) => (
          <article key={title} className="rounded-2xl border border-slate-200 p-6">
            <h2 className="font-bold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">{text}</p>
          </article>
        ))}
      </section>
      <footer className="border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-5 py-8 flex flex-col sm:flex-row gap-2 justify-between text-sm text-slate-500">
          <p>© {new Date().getFullYear()} Agendo</p>
          <a href="https://carflowauto.github.io/agendo/" className="hover:text-slate-800">Voir la maquette</a>
        </div>
      </footer>
    </div>
  );
}
