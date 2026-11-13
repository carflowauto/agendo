import { NextResponse } from "next/server";
import { pushAppointment } from "@/lib/google/sync";

export async function GET() {
  const result = await pushAppointment("preview");
  return NextResponse.json(
    {
      ok: false,
      status: "not_connected",
      message:
        "La synchronisation Google Agenda est préparée (table google_calendar_connections, routes /api/google/connect et /api/google/callback) mais elle n’est pas activée.",
      detail: result.reason,
    },
    { status: 501 },
  );
}
