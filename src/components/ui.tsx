import type { ReactNode } from "react";
import { SheensyLogo } from "@/components/sheensy-logo";

export const fieldClass =
  "mt-1 w-full rounded-2xl border border-white/80 bg-white px-3.5 h-11 text-base text-slate-900 outline-none shadow-sm focus:ring-2 focus:ring-brand-400";
export const labelClass = "block text-sm font-medium text-slate-700";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-2xl grad px-4 h-11 text-sm font-semibold text-white shadow-md shadow-brand-500/20 hover:opacity-95 disabled:opacity-40";
export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-2xl border border-white/80 bg-white/80 px-4 h-11 text-sm font-semibold text-slate-700 hover:bg-white";
export const cardClass = "bg-white/80 backdrop-blur rounded-[24px] border border-white/80 shadow-sm";

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return <SheensyLogo href={href} size={compact ? "sm" : "md"} />;
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-3 mb-6">
      <div className="min-w-0">
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">{title}</h1>
        {subtitle ? <p className="text-sm text-slate-500 mt-1">{subtitle}</p> : null}
      </div>
      {children ? <div className="sm:ml-auto flex flex-wrap gap-2">{children}</div> : null}
    </div>
  );
}

export function Flash({ ok, erreur }: { ok?: string; erreur?: string }) {
  if (erreur) return <p className="mb-4 rounded-xl bg-rose-50 text-rose-700 text-sm px-4 py-3">{erreur}</p>;
  if (ok) return <p className="mb-4 rounded-xl bg-emerald-50 text-emerald-800 text-sm px-4 py-3">{ok === "1" ? "Enregistré." : ok}</p>;
  return null;
}

export function ConfigMissing() {
  return (
    <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
      Configuration incomplète. Copiez <code>.env.example</code> vers <code>.env.local</code>, renseignez la clé anon
      Supabase (sans la commiter), puis relancez le build. L’URL du projet est déjà indiquée dans{" "}
      <code>.env.example</code>.
    </div>
  );
}
