import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      message:
        "Le retour OAuth Google n’est pas branché. Prévu : échanger le code, enregistrer le refresh_token dans google_calendar_connections, puis importer les événements personnels comme créneaux bloqués.",
    },
    { status: 501 },
  );
}
