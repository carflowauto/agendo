/**
 * Point d'entrée du worker Cloudflare `agendo` :
 * - fetch : l'app Next.js générée par OpenNext
 * - scheduled : Cron Trigger (toutes les 5 min) qui envoie la file d'e-mails via Resend
 */
// @ts-ignore -- généré par `opennextjs-cloudflare build`
import { default as handler } from "./.open-next/worker.js";
import { runEmailQueue, type DispatchEnv } from "./src/lib/email/dispatch";

type ScheduledContext = { waitUntil(promise: Promise<unknown>): void };

export default {
  fetch: handler.fetch,
  async scheduled(_event: unknown, env: DispatchEnv, ctx: ScheduledContext) {
    ctx.waitUntil(
      runEmailQueue(env).then(
        (result) => console.log("email-queue", JSON.stringify(result)),
        (error) => console.error("email-queue error", error instanceof Error ? error.message : String(error)),
      ),
    );
  },
};
