import Link from "next/link";
import type { ReactNode } from "react";
import { ProColumn } from "@/components/pro-shell";
import { Flash } from "@/components/ui";

export function SettingsScreen({
  title,
  hint,
  ok,
  erreur,
  children,
}: {
  title: string;
  hint?: string;
  ok?: string;
  erreur?: string;
  children: ReactNode;
}) {
  return (
    <ProColumn
      header={
        <div>
          <Link href="/espace/reglages" className="text-sm font-semibold text-brand-700">‹ Réglages</Link>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
          {hint ? <p className="text-sm text-slate-500">{hint}</p> : null}
          <Flash ok={ok} erreur={erreur} />
        </div>
      }
    >
      {children}
    </ProColumn>
  );
}

export function SettingsRow({ href, title, detail }: { href: string; title: string; detail?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 px-4 py-3">
      <span className="min-w-0 flex-1">
        <span className="block font-semibold text-slate-900">{title}</span>
        {detail ? <span className="block truncate text-sm text-slate-500">{detail}</span> : null}
      </span>
      <span className="text-slate-300" aria-hidden="true">›</span>
    </Link>
  );
}
