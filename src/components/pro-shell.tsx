"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const TABS = [
  { href: "/espace/aujourdhui", label: "Aujourd'hui", icon: "today" },
  { href: "/espace/agenda", label: "Agenda", icon: "agenda" },
  { href: "/espace/clientes", label: "Clientes", icon: "people" },
  { href: "/espace/reglages", label: "Réglages", icon: "gear" },
] as const;

function TabIcon({ name }: { name: (typeof TABS)[number]["icon"] }) {
  const common = "w-5 h-5";
  if (name === "today") {
    return (
      <svg className={common} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="4" />
        <path strokeLinecap="round" d="M12 3v2M12 19v2M3 12h2M19 12h2" />
      </svg>
    );
  }
  if (name === "agenda") {
    return (
      <svg className={common} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path strokeLinecap="round" d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    );
  }
  if (name === "people") {
    return (
      <svg className={common} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
        <circle cx="9" cy="9" r="3" />
        <path strokeLinecap="round" d="M4 19c.6-2.6 2.6-4 5-4s4.4 1.4 5 4M17 11a2.5 2.5 0 100-5M18 19c.3-1.6 1.2-2.8 2.5-3.4" />
      </svg>
    );
  }
  return (
    <svg className={common} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3" />
      <path strokeLinecap="round" d="M12 3.5v2.2M12 18.3V20.5M3.5 12h2.2M18.3 12H20.5M6 6l1.6 1.6M16.4 16.4L18 18M18 6l-1.6 1.6M7.6 16.4L6 18" />
    </svg>
  );
}

export function ProShell({ activePath, children }: { profile?: { full_name: string }; email?: string; needsSetup?: boolean; activePath?: string; children: ReactNode }) {
  const pathname = usePathname();
  const current = activePath ?? pathname;
  const active = (href: string) => current === href || current.startsWith(`${href}/`);

  return (
    <div className="h-dvh overflow-hidden bg-[radial-gradient(circle_at_top,_#fde7f3_0%,_#eef2ff_38%,_#f8fafc_100%)] text-slate-800">
      <div className="mx-auto flex h-full w-full max-w-md flex-col">
        <div className="min-h-0 flex-1">{children}</div>
        <nav className="shrink-0 grid h-[4.25rem] grid-cols-4 border-t border-white/70 bg-white/85 px-1 backdrop-blur" aria-label="Espace pro">
          {TABS.map((tab) => {
            const on = active(tab.href);
            return (
              <Link key={tab.href} href={tab.href} className={`flex flex-col items-center justify-center gap-0.5 text-[10px] font-semibold ${on ? "text-brand-700" : "text-slate-500"}`}>
                <TabIcon name={tab.icon} />
                {tab.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function ProColumn({ header, actions, children }: { header: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col px-4 pt-4">
      <div className="shrink-0">{header}</div>
      {actions ? <div className="mt-3 shrink-0 space-y-2">{actions}</div> : null}
      <div className="mt-3 min-h-0 flex-1 overflow-y-auto pb-3">{children}</div>
    </div>
  );
}
