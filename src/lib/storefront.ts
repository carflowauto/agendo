export function mapsSearchUrl(address: string | null | undefined, city: string | null | undefined) {
  const query = [address?.trim(), city?.trim()].filter(Boolean).join(", ");
  if (!query) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

export function hasReviews(count: number) {
  return count > 0;
}
