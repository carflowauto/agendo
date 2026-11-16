/**
 * Point d'entrée du worker Cloudflare `agendo` :
 * - fetch : l'app Next.js générée par OpenNext
 * - scheduled : Cron Trigger (toutes les 5 min) qui envoie la file d'e-mails via Resend
 *   et synchronise Google Agenda (inactif tant que GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET sont absents)
 */
// @ts-ignore -- généré par `opennextjs-cloudflare build`
import { default as handler } from "./.open-next/worker.js";
import { runEmailQueue, type DispatchEnv } from "./src/lib/email/dispatch";
import type { GoogleEnv } from "./src/lib/google/config";
import { runGoogleSync } from "./src/lib/google/sync";

type ScheduledContext = { waitUntil(promise: Promise<unknown>): void };

export default {
  fetch: handler.fetch,
  async scheduled(_event: unknown, env: DispatchEnv & GoogleEnv, ctx: ScheduledContext) {
    ctx.waitUntil(
      runEmailQueue(env).then(
        (result) => console.log("email-queue", JSON.stringify(result)),
        (error) => console.error("email-queue error", error instanceof Error ? error.message : String(error)),
      ),
    );
    ctx.waitUntil(
      runGoogleSync(env).then(
        (result) => {
          if (!result.skipped) console.log("google-sync", JSON.stringify(result));
        },
        (error) => console.error("google-sync error", error instanceof Error ? error.message : String(error)),
      ),
    );
  },
};
