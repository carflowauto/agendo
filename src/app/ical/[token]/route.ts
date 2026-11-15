import { calendarFeedResponse } from "@/lib/calendar/feed-response";

export const dynamic = "force-dynamic";

/** Ancienne adresse du flux, conservée pour les abonnements déjà créés. */
export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  return calendarFeedResponse(token);
}
