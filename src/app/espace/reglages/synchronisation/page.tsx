import Link from "next/link";
import { CalendarSync, type SyncPreviewRow } from "@/components/calendar-sync";
import { addDays, formatDuration, formatTime, parisDateKey, zonedWallTimeToUtc } from "@/lib/dates";
import { calendarFeedUrls } from "@/lib/ical";
import { siteUrl } from "@/lib/site";
import type { Appointment } from "@/lib/types";
import { requireProfile } from "@/server/profile";

export const metadata = { title: "Connecter mon agenda" };
export const dynamic = "force-dynamic";

export default async function SyncPage() {
  const { supabase, profile } = await requireProfile();
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
      <CalendarSync webcalUrl={urls.webcal} googleUrl={urls.google} feedUrl={urls.https} connected={connected} today={today} />
    </div>
  );
}
