"use server";

import { revalidatePath } from "next/cache";
import { dbError } from "@/lib/db-error";
import { rpc } from "@/lib/email/dispatch";
import { googleConfigured, processGoogleEnv } from "@/lib/google/config";
import { decryptToken } from "@/lib/google/crypto";
import { revokeToken } from "@/lib/google/oauth";
import { runGoogleBusySync } from "@/lib/google/sync";
import { requireProfile } from "@/server/profile";

const PATH = "/espace/reglages/synchronisation";

/** Déconnecte Google : révoque le jeton et supprime toutes les données Google de la pro. */
export async function disconnectGoogle() {
  const { profile } = await requireProfile();
  const env = processGoogleEnv();
  if (!googleConfigured(env)) return { ok: false as const, error: "Google Agenda n’est pas disponible." };
  try {
    const sealed = await rpc<string | null>(env, "google_account_delete", {
      p_secret: env.EMAIL_QUEUE_SECRET,
      p_profile_id: profile.id,
    });
    if (sealed) {
      try {
        await revokeToken(await decryptToken(sealed, env.GOOGLE_TOKEN_KEY!, profile.id));
      } catch {
        /* données déjà supprimées ; la révocation est au mieux */
      }
    }
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? dbError({ message: error.message }) : "Une erreur est survenue." };
  }
  revalidatePath(PATH);
  return { ok: true as const };
}

/** Actualise tout de suite les absences Google de la pro. */
export async function refreshGoogleBusy() {
  const { supabase, profile } = await requireProfile();
  const env = processGoogleEnv();
  if (!googleConfigured(env)) return { ok: false as const, error: "Google Agenda n’est pas disponible." };
  const { error } = await supabase.rpc("google_request_busy_sync");
  if (error) return { ok: false as const, error: dbError(error) };
  try {
    await runGoogleBusySync(env, { profileId: profile.id });
  } catch {
    /* le cron réessaiera : la demande est enregistrée */
  }
  revalidatePath(PATH);
  return { ok: true as const };
}
