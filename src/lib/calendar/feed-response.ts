import { buildIcs, parseCalendarToken, type CalendarFeed } from "@/lib/ical";
import { hasSupabaseEnv, supabaseAnonKey, supabaseUrl } from "@/lib/env";

function notFound() {
  return new Response("Calendrier introuvable", {
    status: 404,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/** Réponse du flux iCal privé d'une pro, à partir du jeton de l'URL (avec ou sans .ics). */
export async function calendarFeedResponse(rawToken: string) {
  const token = parseCalendarToken(rawToken);
  if (!token || !hasSupabaseEnv()) return notFound();
  const res = await fetch(`${supabaseUrl()}/rest/v1/rpc/get_calendar_feed`, {
    method: "POST",
    headers: {
      apikey: supabaseAnonKey(),
      Authorization: `Bearer ${supabaseAnonKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ p_token: token }),
    cache: "no-store",
  });
  if (!res.ok) {
    return new Response("Calendrier momentanément indisponible", { status: 503, headers: { "Retry-After": "300", "Cache-Control": "no-store" } });
  }
  const feed = (await res.json()) as CalendarFeed | null;
  if (!feed) return notFound();
  return new Response(buildIcs(feed), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="sheensy.ics"',
      "Cache-Control": "private, max-age=300",
      "X-Robots-Tag": "noindex",
    },
  });
}
