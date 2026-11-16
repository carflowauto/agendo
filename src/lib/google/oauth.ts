/** OAuth 2.0 Google (flux web, accès hors ligne, PKCE S256). */
import { base64UrlDecode } from "./crypto";
import { GOOGLE_SCOPES, REQUIRED_SCOPES, redirectUri, type GoogleEnv } from "./config";

export const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
export const GOOGLE_REVOKE_URL = "https://oauth2.googleapis.com/revoke";

export function buildAuthUrl(env: GoogleEnv, state: string, codeChallenge: string): string {
  const params = new URLSearchParams({
    client_id: env.GOOGLE_CLIENT_ID ?? "",
    redirect_uri: redirectUri(env),
    response_type: "code",
    scope: GOOGLE_SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

export class GoogleAuthError extends Error {
  constructor(
    message: string,
    /** true : jeton révoqué ou expiré (invalid_grant), il faut reconnecter le compte. */
    readonly revoked = false,
  ) {
    super(message);
  }
}

type TokenResponse = {
  access_token?: string;
  refresh_token?: string;
  id_token?: string;
  scope?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
};

async function postToken(body: Record<string, string>): Promise<TokenResponse> {
  const res = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  let data: TokenResponse = {};
  try {
    data = (await res.json()) as TokenResponse;
  } catch {
    /* réponse non JSON */
  }
  if (!res.ok || data.error) {
    const code = data.error ?? `HTTP ${res.status}`;
    throw new GoogleAuthError(`Google OAuth: ${code}`, code === "invalid_grant");
  }
  return data;
}

export async function exchangeCode(env: GoogleEnv, code: string, codeVerifier: string) {
  const data = await postToken({
    code,
    client_id: env.GOOGLE_CLIENT_ID ?? "",
    client_secret: env.GOOGLE_CLIENT_SECRET ?? "",
    redirect_uri: redirectUri(env),
    grant_type: "authorization_code",
    code_verifier: codeVerifier,
  });
  if (!data.access_token) throw new GoogleAuthError("Google OAuth: access_token absent");
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? null,
    scope: data.scope ?? "",
    email: emailFromIdToken(data.id_token),
  };
}

export async function refreshAccessToken(env: GoogleEnv, refreshToken: string): Promise<string> {
  const data = await postToken({
    client_id: env.GOOGLE_CLIENT_ID ?? "",
    client_secret: env.GOOGLE_CLIENT_SECRET ?? "",
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });
  if (!data.access_token) throw new GoogleAuthError("Google OAuth: access_token absent");
  return data.access_token;
}

/** Révoque le jeton chez Google (best effort : un jeton déjà révoqué renvoie 400). */
export async function revokeToken(token: string): Promise<boolean> {
  try {
    const res = await fetch(GOOGLE_REVOKE_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ token }).toString(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * E-mail du compte Google. L'id_token arrive directement de l'endpoint token de Google en TLS :
 * selon OpenID Connect (§3.1.3.7), sa signature n'a pas besoin d'être vérifiée dans ce cas.
 */
export function emailFromIdToken(idToken: string | undefined): string | null {
  if (!idToken) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(idToken.split(".")[1] ?? ""))) as {
      email?: string;
    };
    return typeof payload.email === "string" ? payload.email : null;
  } catch {
    return null;
  }
}

export function hasRequiredScopes(granted: string): boolean {
  const set = new Set(granted.split(/\s+/).filter(Boolean));
  return REQUIRED_SCOPES.every((s) => set.has(s));
}
