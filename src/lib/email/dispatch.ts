/**
 * Envoi de la file email_outbox via Resend.
 * Utilisé par le Cron Trigger du worker (toutes les 5 min) et par /api/cron/rappels.
 * Aucune clé service_role : la file passe par des fonctions SQL protégées par EMAIL_QUEUE_SECRET.
 */
import { renderEmail, type EmailJob } from "./templates";

export type DispatchEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  EMAIL_QUEUE_SECRET?: string;
  RESEND_API_KEY?: string;
};

export type DispatchResult = { claimed: number; sent: number; failed: number; error?: string };

async function rpc<T>(env: DispatchEnv, fn: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/rpc/${fn}`, {
    method: "POST",
    headers: {
      apikey: env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
      Authorization: `Bearer ${env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${fn}: HTTP ${res.status} ${text.slice(0, 200)}`);
  return (text ? JSON.parse(text) : null) as T;
}

export async function sendWithResend(apiKey: string, job: EmailJob, siteUrl: string) {
  const mail = renderEmail(job, siteUrl);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `sheensy-outbox-${job.id}`,
    },
    body: JSON.stringify({
      from: mail.from,
      to: [mail.to],
      ...(mail.replyTo ? { reply_to: mail.replyTo } : {}),
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    }),
  });
  const text = await res.text();
  let data: { id?: string; message?: string } = {};
  try {
    data = JSON.parse(text);
  } catch {
    /* réponse non JSON */
  }
  if (res.ok && data.id) return { ok: true as const, id: data.id };
  // 4xx (hors 408/409/429) : erreur définitive, inutile de réessayer.
  const permanent = res.status >= 400 && res.status < 500 && ![408, 409, 429].includes(res.status);
  return { ok: false as const, permanent, error: `Resend HTTP ${res.status}: ${data.message ?? text.slice(0, 200)}` };
}

export async function runEmailQueue(env: DispatchEnv, limit = 20): Promise<DispatchResult> {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY || !env.EMAIL_QUEUE_SECRET || !env.RESEND_API_KEY) {
    return { claimed: 0, sent: 0, failed: 0, error: "Configuration e-mail incomplète." };
  }
  const siteUrl = env.NEXT_PUBLIC_SITE_URL || "https://sheensy.com";
  const jobs = await rpc<EmailJob[]>(env, "email_queue_claim", { p_secret: env.EMAIL_QUEUE_SECRET, p_limit: limit });
  let sent = 0;
  let failed = 0;
  for (const job of jobs ?? []) {
    let outcome: Awaited<ReturnType<typeof sendWithResend>>;
    try {
      outcome = await sendWithResend(env.RESEND_API_KEY, job, siteUrl);
    } catch (error) {
      outcome = { ok: false, permanent: false, error: error instanceof Error ? error.message : String(error) };
    }
    if (outcome.ok) sent += 1;
    else failed += 1;
    await rpc(env, "email_queue_complete", {
      p_secret: env.EMAIL_QUEUE_SECRET,
      p_id: job.id,
      p_ok: outcome.ok,
      p_error: outcome.ok ? null : outcome.error,
      p_message_id: outcome.ok ? outcome.id : null,
      p_permanent: outcome.ok ? false : outcome.permanent,
    });
  }
  return { claimed: jobs?.length ?? 0, sent, failed };
}
