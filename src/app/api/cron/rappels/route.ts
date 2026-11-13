import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { resendConfigured } from "@/lib/email/reminders";

export async function GET(request: Request) {
  const secret = process.env.REMINDERS_CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    return NextResponse.json(
      {
        configured: false,
        message: "SUPABASE_SERVICE_ROLE_KEY absente. La file email_outbox existe, la lecture cron ne peut pas démarrer.",
      },
      { status: 500 },
    );
  }
  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const { count, error } = await supabase
    .from("email_outbox")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending")
    .lte("scheduled_for", new Date().toISOString());
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({
    configured: resendConfigured(),
    pending: count ?? 0,
    message: resendConfigured()
      ? "Une clé Resend est présente, mais l’envoi n’est pas branché. Les messages restent dans email_outbox."
      : "Aucun fournisseur d’e-mail. Les rappels sont enregistrés dans email_outbox et ne partent pas.",
  });
}
