"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition, type ReactNode } from "react";
import { GoogleCalendarIcon } from "@/components/calendar-sync";
import { disconnectGoogle, refreshGoogleBusy } from "@/server/google-actions";

export type GoogleConnectionView = {
  status: "not_connected" | "pending" | "connected" | "error";
  email: string | null;
  lastSyncedAt: string | null;
  lastError: string | null;
  busyCount: number;
};

const NOTICES: Record<string, { tone: "ok" | "warn"; text: string }> = {
  connecte: { tone: "ok", text: "Google Agenda est connecté." },
  annule: { tone: "warn", text: "Connexion annulée. Vous pouvez réessayer quand vous voulez." },
  permissions: { tone: "warn", text: "Cochez les deux autorisations Google Agenda pour que la synchro fonctionne, puis réessayez." },
  erreur: { tone: "warn", text: "La connexion Google n’a pas abouti. Réessayez." },
  indisponible: { tone: "warn", text: "Google Agenda n’est pas disponible pour le moment." },
};

function Ico({ d, size = 18, strokeWidth = 1.9 }: { d: ReactNode; size?: number; strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {d}
    </svg>
  );
}

/** Logo « G » officiel de Google (4 couleurs), à utiliser tel quel selon la charte Google. */
function GoogleG() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

/** Bouton conforme aux consignes Google (thème clair : fond blanc, bordure #747775, texte #1F1F1F). */
function GoogleButton({ label }: { label: string }) {
  return (
    <a
      href="/api/google/connect"
      className="mt-3.5 flex h-[48px] w-full items-center justify-center gap-3 rounded-full border border-[#747775] bg-white px-3 text-[14.5px] font-medium tracking-[0.01em] text-[#1F1F1F] transition-colors hover:bg-[#F8F8F8] active:bg-[#F1F1F1]"
      style={{ fontFamily: "Roboto, Arial, sans-serif" }}
    >
      <GoogleG />
      <span>{label}</span>
    </a>
  );
}

function sinceLabel(iso: string | null) {
  if (!iso) return "Première actualisation en cours…";
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 1) return "Actualisé à l’instant";
  if (minutes < 60) return `Actualisé il y a ${minutes} min`;
  const hours = Math.round(minutes / 60);
  return hours < 24 ? `Actualisé il y a ${hours} h` : "Actualisé il y a plus d’un jour";
}

export function GoogleConnect({ connection, notice }: { connection: GoogleConnectionView; notice?: string | null }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [action, setAction] = useState<"refresh" | "disconnect" | null>(null);
  const flash = notice ? NOTICES[notice] : undefined;

  const run = (kind: "refresh" | "disconnect") => {
    if (kind === "disconnect" && !window.confirm("Déconnecter Google Agenda ?\n\nVos absences Google ne bloqueront plus vos créneaux et Sheensy n’enverra plus vos rendez-vous dans Google.")) return;
    setError(null);
    setAction(kind);
    startTransition(async () => {
      const result = kind === "refresh" ? await refreshGoogleBusy() : await disconnectGoogle();
      if (!result.ok) setError(result.error);
      setAction(null);
      router.replace("/espace/reglages/synchronisation");
      router.refresh();
    });
  };

  const flashBox =
    flash && !(flash.tone === "ok" && connection.status !== "connected") ? (
      <p className={`mt-2.5 rounded-[12px] px-3 py-2 text-[12px] font-medium leading-[1.4] ${flash.tone === "ok" ? "bg-[#ecfdf3] text-[#087443]" : "bg-[#FDECEF] text-[#B4234B]"}`}>
        {flash.text}
      </p>
    ) : null;

  const card = "mt-3 rounded-[24px] border border-[rgba(243,213,220,0.7)] bg-white px-3.5 pb-3 pt-3.5 shadow-[0_10px_28px_rgba(74,18,56,0.07)]";

  if (connection.status === "connected" || connection.status === "error") {
    const broken = connection.status === "error";
    return (
      <section className={card}>
        {broken ? (
          <div className="flex items-center gap-2.5 rounded-[16px] border border-[#F6C9D4] bg-[#FDECEF] p-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#D9577A] text-white">
              <Ico strokeWidth={2.4} d={<path d="M12 7v6M12 17h.01" />} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[15.5px] font-extrabold tracking-[-0.02em] text-[#4A1238]">Reconnectez Google Agenda</h2>
              <p className="mt-px text-[12px] leading-[1.35] text-[#8E3A55]">{connection.lastError || "Google a retiré l’accès à votre agenda."}</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 rounded-[16px] border border-[#c7f0d6] bg-[#ecfdf3] p-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#12b76a] text-white">
              <Ico strokeWidth={2.6} d={<path d="M5 12.5l5 5L19 7" />} />
            </span>
            <div className="min-w-0">
              <h2 className="text-[15.5px] font-extrabold tracking-[-0.02em] text-[#085d3a]">Google Agenda connecté ✓</h2>
              <p className="mt-px truncate text-[12px] leading-[1.35] text-[#087443]">{connection.email || "Compte Google"}</p>
            </div>
          </div>
        )}
        {flashBox}
        {broken ? (
          <GoogleButton label="Continuer avec Google" />
        ) : (
          <div className="mt-3 flex flex-col gap-1.5">
            <div className="flex items-center gap-2.5 rounded-[12px] bg-[#FBF4F6] px-2.5 py-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#D9577A]">
                <Ico size={15} d={<><rect x="3.5" y="5" width="17" height="15" rx="3" /><path d="M3.5 10h17M8 3v4M16 3v4M9 14l6 4M15 14l-6 4" /></>} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-bold leading-[1.3] text-[#4A1238]">Mes absences Google bloquent mes créneaux</p>
                <p className="mt-px text-[11px] leading-[1.35] text-[#8E7F87]">
                  {sinceLabel(connection.lastSyncedAt)}
                  {connection.lastSyncedAt ? ` · ${connection.busyCount} créneau${connection.busyCount > 1 ? "x" : ""} bloqué${connection.busyCount > 1 ? "s" : ""}` : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => run("refresh")}
                disabled={pending}
                className="inline-flex h-[30px] shrink-0 items-center rounded-full border border-[#F0C6D2] bg-white px-2.5 text-[11.5px] font-semibold text-[#4A1238] disabled:opacity-50"
              >
                {pending && action === "refresh" ? "…" : "Actualiser"}
              </button>
            </div>
            <div className="flex items-center gap-2.5 rounded-[12px] bg-[#FBF4F6] px-2.5 py-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[#D9577A]">
                <Ico size={15} d={<path d="M4 12h12M12 6l6 6-6 6" />} />
              </span>
              <p className="min-w-0 flex-1 text-[12.5px] font-bold leading-[1.3] text-[#4A1238]">Mes rendez-vous Sheensy arrivent dans Google</p>
            </div>
          </div>
        )}
        <div className="mt-3 border-t border-[#f6eef1] pt-2.5">
          <button type="button" onClick={() => run("disconnect")} disabled={pending} className="text-[13px] font-semibold text-[#D9577A] disabled:opacity-50">
            {pending && action === "disconnect" ? "Déconnexion…" : "Déconnecter"}
          </button>
          <p className="mt-1 text-[11.5px] leading-[1.4] text-[#8E7F87]">Sheensy ne voit que vos heures occupées, jamais le contenu de vos événements.</p>
          {error ? <p className="mt-1 text-[11.5px] text-rose-700">{error}</p> : null}
        </div>
      </section>
    );
  }

  return (
    <section className={card}>
      <div className="flex items-center gap-2">
        <GoogleCalendarIcon />
        <h2 className="text-[15.5px] font-bold tracking-[-0.02em] text-[#4A1238]">Connecter Google Agenda</h2>
      </div>
      <p className="mt-2 text-[13px] leading-[1.45] text-[#8E7F87]">
        Vos rendez-vous Sheensy arrivent dans Google Agenda, et vos absences Google bloquent vos créneaux en ligne.
      </p>
      {flashBox}
      <GoogleButton label="Continuer avec Google" />
      <p className="mt-2 flex items-start gap-[5px] text-[11px] leading-[1.4] text-[#B7A8B0]">
        <span className="mt-px shrink-0">
          <Ico size={12} d={<><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>} />
        </span>
        <span>Sheensy ne voit que vos heures occupées, jamais le contenu de vos événements.</span>
      </p>
    </section>
  );
}
