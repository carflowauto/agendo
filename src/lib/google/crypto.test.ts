import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import test from "node:test";
import { base64UrlEncode, decryptToken, encryptToken, parseTokenKey, pkceChallenge, randomToken } from "./crypto";
import { openOAuthState, sealOAuthState } from "./session";

const key = Buffer.alloc(32, 7).toString("base64");
const otherKey = Buffer.alloc(32, 9).toString("base64");
const profile = "11111111-2222-3333-4444-555555555555";

test("chiffrement AES-GCM : aller-retour, IV aléatoire, rien en clair", async () => {
  const sealed = await encryptToken("1//refresh-token-secret", key, profile);
  assert.match(sealed, /^v1\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  assert.ok(!sealed.includes("refresh-token-secret"));
  assert.equal(await decryptToken(sealed, key, profile), "1//refresh-token-secret");
  assert.notEqual(await encryptToken("1//refresh-token-secret", key, profile), sealed);
});

test("chiffrement : mauvaise clé, autre profil ou jeton modifié sont refusés", async () => {
  const sealed = await encryptToken("secret", key, profile);
  await assert.rejects(decryptToken(sealed, otherKey, profile));
  await assert.rejects(decryptToken(sealed, key, "autre-profil"));
  const [v, iv, ct] = sealed.split(".");
  const flipped = ct.slice(0, -2) + (ct.at(-2) === "A" ? "B" : "A") + ct.at(-1);
  await assert.rejects(decryptToken(`${v}.${iv}.${flipped}`, key, profile));
  await assert.rejects(decryptToken("v0.abc.def", key, profile));
});

test("parseTokenKey exige 32 octets (base64 ou base64url)", () => {
  assert.ok(parseTokenKey(key));
  assert.ok(parseTokenKey(base64UrlEncode(new Uint8Array(32).fill(3))));
  assert.equal(parseTokenKey(Buffer.alloc(16).toString("base64")), null);
  assert.equal(parseTokenKey(""), null);
  assert.equal(parseTokenKey(undefined), null);
});

test("PKCE S256 : base64url(sha256(verifier)), identique à node:crypto", async () => {
  const verifier = randomToken(48);
  const expected = createHash("sha256").update(verifier).digest("base64url");
  assert.equal(await pkceChallenge(verifier), expected);
  assert.match(verifier, /^[A-Za-z0-9_-]{64}$/);
  assert.equal(randomToken(32).length, 43);
});

test("état OAuth : lié au state, à la pro connectée et limité à 10 min", async () => {
  const now = 1_800_000_000_000;
  const sealed = await sealOAuthState({ state: "abc", verifier: "v", userId: profile, issuedAt: now }, key);
  assert.equal((await openOAuthState(sealed, key, { state: "abc", userId: profile }, now + 1000))?.verifier, "v");
  assert.equal(await openOAuthState(sealed, key, { state: "xyz", userId: profile }, now), null);
  assert.equal(await openOAuthState(sealed, key, { state: "abc", userId: "autre" }, now), null);
  assert.equal(await openOAuthState(sealed, key, { state: "abc", userId: profile }, now + 11 * 60_000), null);
  assert.equal(await openOAuthState(sealed, otherKey, { state: "abc", userId: profile }, now), null);
  assert.equal(await openOAuthState(undefined, key, { state: "abc", userId: profile }, now), null);
});
