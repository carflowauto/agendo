/**
 * Chiffrement des jetons Google (AES-256-GCM, WebCrypto : Workers et Node).
 * Clé : GOOGLE_TOKEN_KEY, 32 octets encodés en base64 (ou base64 url-safe).
 * Format : "v1.<iv base64url>.<chiffré+tag base64url>". Le contexte (AAD, ex. l'id de la pro)
 * lie le jeton à son propriétaire : un jeton copié sur un autre profil ne se déchiffre pas.
 */

const enc = new TextEncoder();
const dec = new TextDecoder();

export function base64UrlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64UrlDecode(value: string): Uint8Array {
  const b64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export function parseTokenKey(keyB64: string | undefined | null): Uint8Array | null {
  if (!keyB64) return null;
  try {
    const raw = base64UrlDecode(keyB64.trim());
    return raw.length === 32 ? raw : null;
  } catch {
    return null;
  }
}

async function importKey(keyB64: string) {
  const raw = parseTokenKey(keyB64);
  if (!raw) throw new Error("GOOGLE_TOKEN_KEY invalide (32 octets en base64 attendus).");
  return crypto.subtle.importKey("raw", raw as BufferSource, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptToken(plain: string, keyB64: string, context: string): Promise<string> {
  const key = await importKey(keyB64);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource, additionalData: enc.encode(context) as BufferSource },
    key,
    enc.encode(plain) as BufferSource,
  );
  return `v1.${base64UrlEncode(iv)}.${base64UrlEncode(new Uint8Array(ct))}`;
}

export async function decryptToken(sealed: string, keyB64: string, context: string): Promise<string> {
  const [version, ivPart, ctPart] = sealed.split(".");
  if (version !== "v1" || !ivPart || !ctPart) throw new Error("Jeton chiffré illisible.");
  const key = await importKey(keyB64);
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64UrlDecode(ivPart) as BufferSource, additionalData: enc.encode(context) as BufferSource },
    key,
    base64UrlDecode(ctPart) as BufferSource,
  );
  return dec.decode(plain);
}

export function randomToken(bytes = 32): string {
  return base64UrlEncode(crypto.getRandomValues(new Uint8Array(bytes)));
}

/** PKCE S256 : code_challenge = base64url(sha256(verifier)). */
export async function pkceChallenge(verifier: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(verifier) as BufferSource);
  return base64UrlEncode(new Uint8Array(digest));
}
