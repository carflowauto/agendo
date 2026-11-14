import Link from "next/link";
import { SheensyLogo } from "@/components/sheensy-logo";

export const metadata = { title: "Vous êtes pro ?" };

export default function ProMarketingPage() {
  return (
    <div className="min-h-screen bg-white text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-5">
          <SheensyLogo href="/" />
          <div className="ml-auto flex items-center gap-2">
            <Link href="/connexion" className="inline-flex h-10 items-center px-4 text-sm font-semibold text-slate-700">Connexion</Link>
            <Link href="/inscription" className="inline-flex h-10 items-center rounded-xl bg-gradient-to-r from-[#F25A8C] to-[#5A1844] px-4 text-sm font-semibold text-white">Créer mon espace</Link>
          </div>
        </div>
      </header>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#FDE4EC] via-white to-white" />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-20 pt-16 lg:grid-cols-2">
          <div>
            <p className="inline-flex rounded-full border border-[#F3C6D2] bg-white px-3 py-1.5 text-xs font-semibold text-[#E23B6E]">Pour les pros de la beauté</p>
            <h1 className="mt-6 text-4xl font-extrabold leading-[1.05] tracking-tight text-[#3B1230] sm:text-5xl">
              Vos clientes réservent en ligne
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-600">
              Sheensy est l’espace pro pour gérer la journée, l’agenda, les fiches clientes et la page de réservation. Un lien, et des créneaux qui se remplissent tout seuls.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/inscription" className="inline-flex h-12 items-center justify-center rounded-xl bg-gradient-to-r from-[#F25A8C] to-[#5A1844] px-6 font-semibold text-white">Créer mon espace gratuitement</Link>
              <Link href="/connexion" className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 font-semibold">J’ai déjà un compte</Link>
            </div>
            <p className="mt-4 text-sm text-slate-500">Inscription en trois étapes · enseigne, ville, accès.</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl shadow-[#4A1238]/10">
            <p className="text-xs text-slate-500">Aujourd’hui</p>
            <p className="font-bold text-slate-900">Trois rendez-vous, le chiffre d’affaires sous les yeux</p>
            <div className="mt-4 space-y-2">
              <div className="rounded-lg border-l-4 border-[#E23B6E] bg-[#FDECEF] px-3 py-2">
                <p className="text-sm font-semibold text-[#4A1238]">Camille Durand</p>
                <p className="text-xs text-[#E23B6E]">Coupe · 09:30</p>
              </div>
              <div className="rounded-lg border-l-4 border-[#C46B8A] bg-[#FDF2F6] px-3 py-2">
                <p className="text-sm font-semibold text-[#4A1238]">Léa Martin</p>
                <p className="text-xs text-[#8E7F87]">Soin · 14:00</p>
              </div>
              <div className="rounded-lg border border-dashed border-slate-300 px-3 py-2">
                <p className="text-sm font-semibold text-slate-600">Pause déjeuner</p>
                <p className="text-xs text-slate-500">Créneau bloqué</p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-5 pb-20 sm:grid-cols-3">
        {[
          ["Aujourd’hui", "Les rendez-vous du jour, l’appel, WhatsApp et le chiffre d’affaires."],
          ["Votre lien", "Une page vitrine avec prestations, créneaux libres et QR code."],
          ["Relances", "Un message WhatsApp, quelques semaines après le rendez-vous."],
        ].map(([title, text]) => (
          <article key={title} className="rounded-2xl border border-slate-200 p-6">
            <h2 className="font-bold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{text}</p>
          </article>
        ))}
      </section>
      <footer className="border-t border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col justify-between gap-2 px-5 py-8 text-sm text-slate-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Sheensy</p>
          <a href="https://carflowauto.github.io/agendo/" className="hover:text-slate-800">Voir la maquette</a>
        </div>
      </footer>
    </div>
  );
}
