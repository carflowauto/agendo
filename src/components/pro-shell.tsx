"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { signOut } from "@/server/actions";
import { initials } from "@/lib/phone";
import { Logo } from "@/components/ui";

const NAV = [
  { href: "/espace/aujourdhui", label: "Aujourd'hui", short: "Jour" },
  { href: "/espace/agenda", label: "Agenda", short: "Agenda" },
  { href: "/espace/clientes", label: "Clientes", short: "Clientes" },
  { href: "/espace/ma-page", label: "Ma page", short: "Page" },
  { href: "/espace/reglages", label: "Réglages", short: "Réglages" },
];

export function ProShell({
  profile,
  email,
  children,
}: {
  profile: { full_name: string; profession: string; city: string; slug: string };
  email: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const active = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  const links = NAV.map((item) => (
    <Link
      key={item.href}
      href={item.href}
      onClick={() => setOpen(false)}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm ${
        active(item.href) ? "bg-brand-50 text-brand-700 font-semibold" : "text-slate-600 hover:bg-slate-100 font-medium"
      }`}
    >
      {item.label}
    </Link>
  ));

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col transition-transform ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="h-16 flex items-center px-5 border-b border-slate-100">
          <Logo href="/espace/aujourdhui" />
        </div>
        <div className="px-4 pt-4">
          <Link href={`/${profile.slug}`} target="_blank" className="flex items-center gap-3 p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50">
            <span className="w-9 h-9 rounded-lg bg-gradient-to-br from-pink-400 to-brand-500 text-white font-bold text-sm flex items-center justify-center">
              {initials(profile.full_name)}
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-slate-900 truncate">{profile.full_name}</span>
              <span className="block text-xs text-slate-500 truncate">
                {profile.profession}
                {profile.city ? ` · ${profile.city}` : ""}
              </span>
            </span>
          </Link>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1">{links}</nav>
        <div className="px-4 pb-4">
          <Link href={`/${profile.slug}`} target="_blank" className="flex items-center gap-2 text-xs font-medium text-brand-700 bg-brand-50 hover:bg-brand-100 rounded-lg px-3 py-2.5 mb-3">
            Voir ma page vitrine
          </Link>
          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <span className="w-9 h-9 rounded-full bg-amber-100 text-amber-800 font-semibold text-sm flex items-center justify-center">
              {initials(profile.full_name)}
            </span>
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-slate-900 truncate">{profile.full_name}</span>
              <span className="block text-xs text-slate-500 truncate">{email}</span>
            </span>
            <form action={signOut}>
              <button type="submit" title="Se déconnecter" className="text-slate-400 hover:text-slate-700 p-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </button>
            </form>
          </div>
        </div>
      </aside>
      {open ? <button aria-label="Fermer le menu" className="fixed inset-0 bg-slate-900/40 z-30 lg:hidden" onClick={() => setOpen(false)} /> : null}
      <div className="lg:pl-64 pb-20 lg:pb-0">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b border-slate-200">
          <div className="h-16 px-4 sm:px-8 flex items-center gap-4">
            <button className="lg:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setOpen(true)} aria-label="Menu">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <form action="/espace/clientes" className="hidden md:flex items-center gap-2 bg-slate-100 rounded-lg px-3 h-9 w-64 text-sm text-slate-500 ml-auto">
              <input name="q" className="bg-transparent outline-none w-full placeholder:text-slate-400" placeholder="Rechercher une cliente…" />
            </form>
          </div>
        </header>
        <main className="p-4 sm:p-8">{children}</main>
      </div>
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 grid grid-cols-5">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} className={`py-2.5 text-center text-[11px] font-semibold ${active(item.href) ? "text-brand-700" : "text-slate-500"}`}>
            {item.short}
          </Link>
        ))}
      </nav>
    </div>
  );
}
