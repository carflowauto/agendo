import type { ReactNode } from "react";
import { Paintbrush, Scissors, Sparkles } from "lucide-react";

function NailIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="6" y="8.5" width="7.2" height="12" rx="3.6" />
      <path d="M7.4 12.2h4.4" strokeLinecap="round" />
      <circle cx="16.6" cy="9" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="18.5" cy="11.8" r="0.9" fill="currentColor" stroke="none" />
      <circle cx="16.6" cy="14.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

const rose = "#E23B6E";
const plum = "#3B1230";

export function AuthShell({ children, trades = true }: { children: ReactNode; trades?: boolean }) {
  return (
    <main className="min-h-dvh bg-[linear-gradient(180deg,#FDE4EC_0%,#FFF6F8_32%,#FFFFFF_58%)]" style={{ color: plum }}>
      <div className="mx-auto flex min-h-dvh w-full max-w-[420px] flex-col px-6 pb-8 pt-12">
        <div className="text-center">
          <p className="relative inline-block text-[52px] font-extrabold leading-none tracking-tight" style={{ color: rose }}>
            Sheensy
            <Sparkles className="absolute -right-3 -top-1 h-5 w-5" strokeWidth={2.2} />
          </p>
          <p className="mt-2 text-[15px] text-[#8E7F87]">L’agenda des pros de la beauté</p>
        </div>
        <div className="mt-8">{children}</div>
        {trades ? (
          <div className="mt-auto pt-8 text-center">
            <div className="flex items-center justify-center gap-5">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FDE8EF]" style={{ color: rose }}>
                <NailIcon className="h-6 w-6" />
              </span>
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FDE8EF]" style={{ color: rose }}>
                <Scissors className="h-6 w-6" strokeWidth={1.7} />
              </span>
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FDE8EF]" style={{ color: rose }}>
                <Paintbrush className="h-6 w-6" strokeWidth={1.7} />
              </span>
            </div>
            <p className="mt-3 text-[13px] text-[#8E7F87]">Ongles · Coiffure · Maquillage · Esthétique</p>
          </div>
        ) : null}
      </div>
    </main>
  );
}

export const authInput =
  "h-12 w-full rounded-2xl border-0 bg-[#FDE8EF] text-[15px] text-[#3B1230] outline-none placeholder:text-[#C4A8B4] focus:ring-2 focus:ring-[#E23B6E]/30";

export const authLabel = "block text-[15px] font-semibold text-[#3B1230]";

export const authButton =
  "flex h-12 w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#F25A8C] to-[#5A1844] text-[16px] font-semibold text-white shadow-sm disabled:opacity-50";
