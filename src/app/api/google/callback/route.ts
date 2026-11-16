import { NextResponse, type NextRequest } from "next/server";
import { rpc } from "@/lib/email/dispatch";
import { googleConfigured, processGoogleEnv, siteUrlFrom } from "@/lib/google/config";
import { encryptToken } from "@/lib/google/crypto";
import { exchangeCode, hasRequiredScopes, revokeToken } from "@/lib/google/oauth";
import { OAUTH_COOKIE, OAUTH_COOKIE_PATH, openOAuthState } from "@/lib/google/session";
import { runGoogleBusySync } from "@/lib/google/sync";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SETTINGS = "/espace/reglages/synchronisation";

/** GET /api/google/callback : retour du consentement Google (redirect URI enregistrée chez Google). */
export async function GET(request: NextRequest) {
  const env = processGoogleEnv();
  const site = siteUrlFrom(env);
  const done = (result: string) => {
    const response = NextResponse.redirect(`${site}${SETTINGS}?google=${result}`);
    response.headers.set("Cache-Control", "no-store");
    response.cookies.set(OAUTH_COOKIE, "", { path: OAUTH_COOKIE_PATH, maxAge: 0 });
    return response;
  };
  if (!googleConfigured(env)) return done("indisponible");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${site}/connexion?suivant=${encodeURIComponent(SETTINGS)}`);

  const params = request.nextUrl.searchParams;
  const saved = await openOAuthState(request.cookies.get(OAUTH_COOKIE)?.value, env.GOOGLE_TOKEN_KEY!, {
    state: params.get("state"),
    userId: user.id,
  });
  if (!saved) return done("erreur");
  if (params.get("error")) return done("annule");
  const code = params.get("code");
  if (!code) return done("erreur");

  try {
    const tokens = await exchangeCode(env, code, saved.verifier);
    if (!hasRequiredScopes(tokens.scope)) {
      await revokeToken(tokens.refreshToken ?? tokens.accessToken);
      return done("permissions");
    }
    if (!tokens.refreshToken) {
      await revokeToken(tokens.accessToken);
      return done("erreur");
    }
    await rpc(env, "google_account_save", {
      p_secret: env.EMAIL_QUEUE_SECRET,
      p_profile_id: user.id,
      p_email: tokens.email,
      p_refresh_token_enc: await encryptToken(tokens.refreshToken, env.GOOGLE_TOKEN_KEY!, user.id),
      p_scopes: tokens.scope,
    });
  } catch (error) {
    console.error("google-callback", error instanceof Error ? error.message : String(error));
    return done("erreur");
  }

  // Premier import des absences tout de suite (le cron prend le relais toutes les 10 min).
  try {
    await runGoogleBusySync(env, { profileId: user.id });
  } catch (error) {
    console.error("google-callback busy", error instanceof Error ? error.message : String(error));
  }
  return done("connecte");
}
