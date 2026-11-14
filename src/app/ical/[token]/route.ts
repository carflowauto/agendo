import { buildIcs } from "@/lib/ical";
import { createClient } from "@/lib/supabase/server";

type IcalPayload = {
  full_name: string;
  events: { uid: string; starts_at: string; ends_at: string; summary: string; description?: string }[];
};

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_ical_events", { p_token: token });
  const payload = data as IcalPayload | null;
  if (error || !payload) return new Response("Calendrier introuvable", { status: 404 });
  const body = buildIcs({
    name: `Sheensy · ${payload.full_name}`,
    events: payload.events ?? [],
  });
  return new Response(body, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'inline; filename="sheensy.ics"',
      "Cache-Control": "no-cache",
    },
  });
}
