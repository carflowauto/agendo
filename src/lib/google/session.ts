/** Cookie de l'aller-retour OAuth : état + vérificateur PKCE + pro connectée, chiffré (AES-GCM). */
import { decryptToken, encryptToken } from "./crypto";

export const OAUTH_COOKIE = "sheensy_google_oauth";
export const OAUTH_COOKIE_PATH = "/api/google";
export const OAUTH_MAX_AGE_S = 600;
const CONTEXT = "sheensy-google-oauth-state";

export type OAuthState = { state: string; verifier: string; userId: string; issuedAt: number };

export function sealOAuthState(value: OAuthState, keyB64: string) {
  return encryptToken(JSON.stringify(value), keyB64, CONTEXT);
}

/** Renvoie l'état seulement s'il est intact, récent, et qu'il correspond au `state` et à la pro connectée. */
export async function openOAuthState(
  sealed: string | undefined,
  keyB64: string,
  expected: { state: string | null; userId: string },
  now = Date.now(),
): Promise<OAuthState | null> {
  if (!sealed || !expected.state) return null;
  try {
    const value = JSON.parse(await decryptToken(sealed, keyB64, CONTEXT)) as OAuthState;
    if (value.state !== expected.state) return null;
    if (value.userId !== expected.userId) return null;
    if (!(now - value.issuedAt >= 0 && now - value.issuedAt <= OAUTH_MAX_AGE_S * 1000)) return null;
    return value;
  } catch {
    return null;
  }
}
