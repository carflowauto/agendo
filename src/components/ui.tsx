import type { ReactNode } from "react";

export const fieldClass =
  "mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 h-10 text-sm outline-none focus:ring-2 focus:ring-brand-500";
export const labelClass = "block text-sm font-medium text-slate-700";
export const btnPrimary =
  "inline-flex items-center justify-center gap-2 rounded-xl grad px-4 h-10 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50";
export const btnSecondary =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 h-10 text-sm font-semibold text-slate-700 hover:bg-slate-50";
export const cardClass = "bg-white rounded-2xl border border-slate-200";

export function Logo({ href = "/", compact = false }: { href?: string; compact?: boolean }) {
  return (
    <a href={href} className="flex items-center gap-2 shrink-0">
      <span className={`grad ${compact ? "w-7 h-7" : "w-8 h-8"} rounded-lg flex items-center justify-center text-white shadow-sm`}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <rect x="3.5" y="5" width="17" height="15" rx="3" />
          <path d="M3.5 10h17M8 3v4M16 3v4" />
          <path d="M9 15l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className={`${compact ? "text-lg" : "text-xl"} font-extrabold tracking-tight text-slate-900`}>Agendo</span>
    </a>
  );
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
