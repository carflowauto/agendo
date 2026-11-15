"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { markCalendarConnected, resetCalendarToken } from "@/server/calendar-actions";

export type SyncPreviewRow = { time: string; name: string; detail: string };

function Ico({ d, size = 22, strokeWidth = 1.9 }: { d: ReactNode; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  );
}

function AppleCalendarIcon() {
  return (
    <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center overflow-hidden rounded-[7px] bg-white">
      <svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true">
        <defs>
          <linearGradient id="sheensy-acg" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#f3f3f5" />
          </linearGradient>
        </defs>
        <rect x="1" y="1" width="24" height="24" rx="6" fill="url(#sheensy-acg)" />
        <path d="M1 9.2h24" stroke="#ead7dc" strokeWidth="0.7" />
        <path d="M7 1h12a6 6 0 0 1 6 6v2.2H1V7a6 6 0 0 1 6-6z" fill="#FF3B30" />
        <text x="13" y="21.2" textAnchor="middle" fontFamily="Inter,system-ui" fontSize="11" fontWeight="700" fill="#1d1d1f">15</text>
      </svg>
    </span>
  );
}

function GoogleCalendarIcon() {
  return (
    <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center overflow-hidden rounded-[7px]">
      <svg width="26" height="26" viewBox="0 0 24 24" aria-hidden="true">
        <rect x="2.2" y="3.2" width="19.6" height="18.2" rx="3.2" fill="#fff" stroke="#188038" strokeWidth="1.4" />
        <path d="M2.2 7.4h19.6" stroke="#188038" strokeWidth="1.2" />
        <path d="M2.2 6.2c0-1.66 1.34-3 3-3H18.8c1.66 0 3 1.34 3 3v1.2H2.2V6.2z" fill="#1a73e8" />
        <path d="M2.2 6.2h3v1.2h-3z" fill="#1967d2" />
        <path d="M18.8 3.2c1.66 0 3 1.34 3 3V7.4h-3V3.2z" fill="#ea4335" />
        <rect x="16.7" y="16.6" width="5.1" height="4.8" rx="0.6" fill="#fbbc04" />
        <text x="11.6" y="17.6" textAnchor="middle" fontFamily="Inter,system-ui" fontSize="8.6" fontWeight="700" fill="#1967d2">31</text>
      </svg>
    </span>
  );
}

function Step({ n, children, aside }: { n: number; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex min-h-[40px] items-center gap-2 rounded-[12px] bg-[#FBF4F6] px-2 py-[7px]">
      <span className="flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full bg-[#D9577A] text-[10px] font-bold text-white">{n}</span>
      <p className="min-w-0 flex-1 text-[12px] font-medium leading-[1.3] text-[#4A1238]">{children}</p>
      {aside}
    </div>
  );
}

const btnBase = "flex h-[52px] w-full items-center justify-center gap-2.5 rounded-[16px] text-[15px] font-bold tracking-[-0.02em]";

export function CalendarSync({
  webcalUrl,
  googleUrl,
  feedUrl,
  connected,
  today,
}: {
  webcalUrl: string;
  googleUrl: string;
  feedUrl: string;
  connected: boolean;
  today: SyncPreviewRow[];
}) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const markConnected = () => {
    // Ne bloque pas l'ouverture du calendrier : on note la connexion en parallèle.
    void markCalendarConnected().then(() => router.refresh(), () => undefined);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(feedUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copiez ce lien :", feedUrl);
    }
  };

  const reset = () => {
    if (!window.confirm("Réinitialiser le lien ?\n\nLe lien actuel cessera de fonctionner : il faudra reconnecter votre agenda sur votre téléphone.")) return;
    setError(null);
    startTransition(async () => {
      const result = await resetCalendarToken();
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  };

  if (connected) {
    return (
      <section className="mt-3 rounded-[24px] border border-[rgba(243,213,220,0.7)] bg-white px-3.5 pb-3 pt-3.5 shadow-[0_10px_28px_rgba(74,18,56,0.07)]">
        <div className="flex items-center gap-2.5 rounded-[16px] border border-[#c7f0d6] bg-[#ecfdf3] p-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#12b76a] text-white">
            <Ico size={18} strokeWidth={2.6} d={<path d="M5 12.5l5 5L19 7" />} />
          </span>
          <div>
            <h2 className="text-[15.5px] font-extrabold tracking-[-0.02em] text-[#085d3a]">Agenda connecté ✓</h2>
            <p className="mt-px text-[12px] leading-[1.35] text-[#087443]">Vos rendez-vous se mettent à jour tout seuls.</p>
          </div>
        </div>
        <div className="mt-3 rounded-[16px] bg-[#FBF4F6] px-3 pb-2 pt-2.5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.04em] text-[#8E7F87]">Aujourd’hui dans votre calendrier</div>
          {today.length ? (
            today.map((row, i) => (
              <div key={`${row.time}-${i}`} className={`flex items-center gap-2.5 py-2 ${i ? "border-t border-[#f0e4e8]" : ""}`}>
                <div className="w-[42px] shrink-0 text-[12px] font-bold text-[#D9577A]">{row.time}</div>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-bold text-[#4A1238]">{row.name}</div>
                  {row.detail ? <div className="mt-px truncate text-[11px] text-[#8E7F87]">{row.detail}</div> : null}
                </div>
              </div>
            ))
          ) : (
            <div className="py-2 text-[13px] text-[#8E7F87]">Aucun rendez-vous aujourd’hui.</div>
          )}
        </div>
        <div className="mt-3 border-t border-[#f6eef1] pt-2.5">
          <button type="button" onClick={reset} disabled={pending} className="text-[13px] font-semibold text-[#D9577A] disabled:opacity-50">
            {pending ? "Réinitialisation…" : "Réinitialiser le lien"}
          </button>
          <p className="mt-1 text-[11.5px] leading-[1.4] text-[#8E7F87]">Le lien actuel cessera de fonctionner. Utile si vous l’avez partagé par erreur.</p>
          {error ? <p className="mt-1 text-[11.5px] text-rose-700">{error}</p> : null}
        </div>
      </section>
    );
  }

  return (
    <section className="mt-3 rounded-[24px] border border-[rgba(243,213,220,0.7)] bg-white px-3.5 pb-3 pt-3.5 shadow-[0_10px_28px_rgba(74,18,56,0.07)]">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#FDECEF] text-[#D9577A]">
          <Ico
            size={20}
            d={
              <>
                <rect x="3.5" y="5" width="17" height="15" rx="3" />
                <path d="M3.5 10h17M8 3v4M16 3v4" />
                <path d="M9.5 14.5l2 2 4-4" strokeWidth="2" />
              </>
            }
          />
        </span>
        <h2 className="text-[15.5px] font-bold tracking-[-0.02em] text-[#4A1238]">Synchroniser avec mon téléphone</h2>
      </div>
      <p className="mt-2 text-[13px] leading-[1.45] text-[#8E7F87]">Vos rendez-vous apparaissent automatiquement dans le calendrier de votre téléphone.</p>

      <a href={webcalUrl} onClick={markConnected} className={`${btnBase} mt-3.5 bg-[#4A1238] text-white shadow-[0_8px_18px_rgba(74,18,56,0.22)]`}>
        <AppleCalendarIcon /> Ajouter à mon iPhone
      </a>
      <div className="mt-2 flex flex-col gap-1.5">
        <Step n={1}>Appuyez sur « Ajouter à mon iPhone ».</Step>
        <Step
          n={2}
          aside={
            <div className="w-[118px] rounded-[8px] bg-white px-2 pb-[5px] pt-1 text-center shadow-[0_2px_8px_rgba(74,18,56,0.1)]" aria-hidden="true">
              <div className="text-[7px] font-semibold tracking-[0.02em] text-[#8E7F87]">CALENDRIER</div>
              <div className="mb-[3px] mt-px whitespace-nowrap text-[8px] font-semibold leading-[1.2] text-[#4A1238]">S’abonner à « Sheensy » ?</div>
              <span className="inline-block rounded-[6px] bg-[#007AFF] px-2 py-0.5 text-[7.5px] font-bold text-white">S’abonner</span>
            </div>
          }
        >
          Validez « S’abonner » dans Calendrier.
        </Step>
      </div>

      <a href={googleUrl} target="_blank" rel="noopener noreferrer" onClick={markConnected} className={`${btnBase} mt-3 border-[1.5px] border-[#F0C6D2] bg-white text-[#4A1238]`}>
        <GoogleCalendarIcon /> Ajouter à Google Agenda
      </a>
      <div className="mt-2 flex flex-col gap-1.5">
        <Step n={1}>Appuyez sur « Ajouter à Google Agenda ».</Step>
        <Step
          n={2}
          aside={
            <div className="flex w-[124px] items-center gap-1.5 rounded-[8px] bg-white px-2 pb-[5px] pt-1 shadow-[0_2px_8px_rgba(74,18,56,0.1)]" aria-hidden="true">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] bg-[#1a73e8] text-[11px] font-bold text-white">+</span>
              <span className="text-[8px] font-semibold leading-[1.25] text-[#3c4043]">Ajouter le calendrier Sheensy</span>
            </div>
          }
        >
          Confirmez l’ajout du calendrier Sheensy.
        </Step>
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-[#f6eef1] pt-2">
        <button type="button" onClick={copy} className="text-[13px] font-semibold text-[#D9577A]">Autre appli (Outlook…)</button>
        <button
          type="button"
          onClick={copy}
          className="inline-flex h-[30px] items-center gap-[5px] rounded-full border border-[#F0C6D2] bg-white px-2.5 text-[11.5px] font-semibold text-[#4A1238]"
        >
          <Ico
            size={13}
            d={
              copied ? (
                <path d="M5 12.5l5 5L19 7" />
              ) : (
                <>
                  <rect x="9" y="9" width="11" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </>
              )
            }
          />
          {copied ? "Lien copié" : "Copier le lien"}
        </button>
      </div>
      <p className="mt-1.5 flex items-start gap-[5px] text-[11px] leading-[1.4] text-[#B7A8B0]">
        <span className="mt-px shrink-0">
          <Ico
            size={12}
            d={
              <>
                <rect x="5" y="11" width="14" height="10" rx="2" />
                <path d="M8 11V8a4 4 0 0 1 8 0v3" />
              </>
            }
          />
        </span>
        <span>Lien personnel&nbsp;: il contient vos rendez‑vous, à ne pas partager.</span>
      </p>
    </section>
  );
}
