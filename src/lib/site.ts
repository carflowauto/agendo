/** URL publique canonique. Défaut : https://sheensy.com */
export function siteUrl() {
  const value = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://sheensy.com";
  return value.replace(/\/$/, "");
}

export function siteHost() {
  return new URL(siteUrl()).host;
}
