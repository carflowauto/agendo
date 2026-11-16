import { NextResponse, type NextRequest } from "next/server";
import { googleConfigured, processGoogleEnv, siteUrlFrom } from "@/lib/google/config";
import { pkceChallenge, randomToken } from "@/lib/google/crypto";
import { buildAuthUrl } from "@/lib/google/oauth";
import { OAUTH_COOKIE, OAUTH_COOKIE_PATH, OAUTH_MAX_AGE_S, sealOAuthState } from "@/lib/google/session";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SETTINGS = "/espace/reglages/synchronisation";

/** GET /api/google/connect : envoie la pro connectée vers l'écran de consentement Google. */
export async function GET(_request: NextRequest) {
  const env = processGoogleEnv();
  const site = siteUrlFrom(env);
  if (!googleConfigured(env)) return NextResponse.redirect(`${site}${SETTINGS}`);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${site}/connexion?suivant=${encodeURIComponent(SETTINGS)}`);

  const state = randomToken(32);
  const verifier = randomToken(48);
  const sealed = await sealOAuthState({ state, verifier, userId: user.id, issuedAt: Date.now() }, env.GOOGLE_TOKEN_KEY!);
  const response = NextResponse.redirect(buildAuthUrl(env, state, await pkceChallenge(verifier)));
  response.headers.set("Cache-Control", "no-store");
  response.cookies.set(OAUTH_COOKIE, sealed, {
    httpOnly: true,
    secure: site.startsWith("https://"),
    sameSite: "lax",
    path: OAUTH_COOKIE_PATH,
    maxAge: OAUTH_MAX_AGE_S,
  });
  return response;
}
