import { NextResponse } from "next/server";
import { runEmailQueue } from "@/lib/email/dispatch";

/**
 * Lance un passage de la file d'e-mails (le Cron Trigger du worker le fait toutes les 5 min).
 * Protégé par `Authorization: Bearer $EMAIL_QUEUE_SECRET`.
 */
export async function POST(request: Request) {
  const secret = process.env.EMAIL_QUEUE_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  try {
    const result = await runEmailQueue({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
      EMAIL_QUEUE_SECRET: process.env.EMAIL_QUEUE_SECRET,
      RESEND_API_KEY: process.env.RESEND_API_KEY,
    });
    return NextResponse.json(result, { status: result.error ? 500 : 200 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

export const GET = POST;
