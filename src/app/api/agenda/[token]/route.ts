import { calendarFeedResponse } from "@/lib/calendar/feed-response";

export const dynamic = "force-dynamic";

/** GET /api/agenda/<jeton>.ics : flux iCal privé (iPhone, Google Agenda, Outlook). */
export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  const { token } = await context.params;
  return calendarFeedResponse(token);
}
