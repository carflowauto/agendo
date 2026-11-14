"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Calendar, Home, Settings, Users } from "lucide-react";
import { initials } from "@/lib/phone";

function mark(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return initials(name);
  return (parts[0] || "S").slice(0, 2).toUpperCase();
}

const TABS = [
  { href: "/espace/aujourdhui", label: "Aujourd'hui", icon: "today" },
  { href: "/espace/agenda", label: "Agenda", icon: "agenda" },
  { href: "/espace/clientes", label: "Clients", icon: "people" },
  { href: "/espace/reglages", label: "Réglages", icon: "gear" },
] as const;

function TabIcon({ name, on }: { name: (typeof TABS)[number]["icon"]; on: boolean }) {
  const props = { className: "h-[22px] w-[22px]", strokeWidth: 1.9, fill: on && name === "today" ? "currentColor" : "none" };
  if (name === "today") return <Home {...props} />;
  if (name === "agenda") return <Calendar {...props} />;
  if (name === "people") return <Users {...props} />;
  return <Settings {...props} />;
}

export function ProShell({ activePath, fullName = "", children }: { profile?: { full_name: string }; email?: string; needsSetup?: boolean; activePath?: string; slug?: string | null; fullName?: string; children: ReactNode }) {
  const pathname = usePathname();
  const current = activePath ?? pathname;
  const active = (href: string) => current === href || current.startsWith(`${href}/`);
  const name = fullName.trim();

  return (
    <div className="h-dvh overflow-hidden bg-white text-[#4A1238]">
      <div className="mx-auto flex h-full w-full max-w-md flex-col">
        <header className="flex shrink-0 items-start justify-between gap-3 bg-white px-4 pb-2 pt-3">
          <div className="min-w-0">
            <p className="text-[28px] font-extrabold leading-none tracking-tight text-[#D9577A]">Sheensy</p>
            {name ? <p className="mt-1 truncate text-[22px] font-bold leading-tight">Bonjour {name}</p> : null}
          </div>
          <span className="relative mt-0.5 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#F6D5E1] text-[13px] font-bold ring-2 ring-white">
            {mark(name || "S")}
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#3DDC84] ring-2 ring-white" />
          </span>
        </header>
        <div className="min-h-0 flex-1">{children}</div>
        <nav className="grid h-16 shrink-0 grid-cols-4 bg-white shadow-[0_-6px_18px_rgba(74,18,56,0.04)]" aria-label="Espace pro">
          {TABS.map((tab) => {
            const on = active(tab.href);
            return (
              <Link key={tab.href} href={tab.href} className={`flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium ${on ? "text-[#D9577A]" : "text-[#C4B4BC]"}`}>
                <TabIcon name={tab.icon} on={on} />
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
