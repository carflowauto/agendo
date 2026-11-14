export const VITRINE_HOST = "agendo.thomas-duraz-agent.workers.dev";

export function vitrineUrl(slug: string) {
  return `https://${VITRINE_HOST}/${slug}`;
}

export function vitrineLabel(slug: string) {
  return `${VITRINE_HOST}/${slug}`;
}

export function mapsSearchUrl(address: string | null | undefined, city: string | null | undefined) {
  const query = [address?.trim(), city?.trim()].filter(Boolean).join(", ");
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function hasReviews(count: number) {
  return count > 0;
}
