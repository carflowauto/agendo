import Link from "next/link";
import { CalendarSync, type SyncPreviewRow } from "@/components/calendar-sync";
import { GoogleConnect, type GoogleConnectionView } from "@/components/google-connect";
import { addDays, formatDuration, formatTime, parisDateKey, zonedWallTimeToUtc } from "@/lib/dates";
import { googleConfigured, processGoogleEnv } from "@/lib/google/config";
import { calendarFeedUrls } from "@/lib/ical";
import { siteUrl } from "@/lib/site";
import type { Appointment } from "@/lib/types";
import { requireProfile } from "@/server/profile";

export const metadata = { title: "Connecter mon agenda" };
export const dynamic = "force-dynamic";

export default async function SyncPage({ searchParams }: { searchParams: Promise<{ google?: string }> }) {
  const { supabase, profile } = await requireProfile();
  const { google: notice } = await searchParams;

  // Google Agenda : visible uniquement quand les identifiants OAuth sont posés sur le worker.
  let google: GoogleConnectionView | null = null;
  if (googleConfigured(processGoogleEnv())) {
    const [{ data: row }, { count }] = await Promise.all([
      supabase
        .from("google_calendar_connections")
        .select("status, google_email, last_synced_at, last_error")
        .eq("profile_id", profile.id)
        .maybeSingle(),
      supabase
        .from("google_busy")
        .select("id", { count: "exact", head: true })
        .eq("profile_id", profile.id)
        .gte("ends_at", new Date().toISOString()),
    ]);
    const r = row as { status?: GoogleConnectionView["status"]; google_email?: string | null; last_synced_at?: string | null; last_error?: string | null } | null;
    google = {
      status: r?.status ?? "not_connected",
      email: r?.google_email ?? null,
      lastSyncedAt: r?.last_synced_at ?? null,
      lastError: r?.last_error ?? null,
      busyCount: count ?? 0,
    };
  }
  const urls = calendarFeedUrls(siteUrl(), profile.ical_token);
  const connected = Boolean(profile.ical_connected_at || profile.ical_last_fetched_at);

  let today: SyncPreviewRow[] = [];
  if (connected) {
    const zone = profile.timezone || "Europe/Paris";
    const day = parisDateKey();
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .eq("profile_id", profile.id)
      .neq("status", "cancelled")
      .gte("starts_at", zonedWallTimeToUtc(day, "00:00", zone).toISOString())
      .lt("starts_at", zonedWallTimeToUtc(addDays(day, 1), "00:00", zone).toISOString())
      .order("starts_at");
    today = ((data as Appointment[] | null) ?? []).map((a) => {
      const minutes = Math.round((new Date(a.ends_at).getTime() - new Date(a.starts_at).getTime()) / 60000);
      const blocked = a.status === "blocked";
      return {
        time: formatTime(a.starts_at),
        name: blocked ? a.service_name || a.notes || "Indisponible" : a.client_name || "Rendez-vous",
        detail: [blocked ? "" : a.service_name, minutes > 0 ? formatDuration(minutes) : ""].filter(Boolean).join(" · "),
      };
    });
  }

  return (
    <div className="h-full overflow-y-auto bg-white px-4 pb-2.5 pt-3 md:pt-4">
      <Link href="/espace/reglages" className="mb-0.5 inline-block text-[14px] font-semibold text-[#D9577A]">‹ Réglages</Link>
      <h1 className="text-[24px] font-extrabold leading-[1.15] tracking-[-0.03em] text-[#4A1238]">Connecter mon agenda</h1>
      <p className="mt-1 text-[13.5px] leading-[1.4] text-[#64748b]">Un appui suffit, puis tout se met à jour tout seul. Aucun compte à créer.</p>
      {google ? (
        <>
          <GoogleConnect connection={google} notice={notice ?? null} />
          <div className="mb-[-4px] mt-4 px-1 text-[11px] font-bold uppercase tracking-[0.04em] text-[#8E7F87]">Ou par abonnement (iPhone, Outlook…)</div>
        </>
      ) : null}
      <CalendarSync webcalUrl={urls.webcal} googleUrl={urls.google} feedUrl={urls.https} connected={connected} today={today} />
    </div>
  );
}
