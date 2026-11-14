export function confirmedCount(items: { status: string }[]) {
  return items.filter((item) => item.status === "confirmed").length;
}

export function nextAppointment<T extends { status: string; starts_at: string; ends_at: string }>(items: T[], now = new Date()) {
  return items
    .filter((item) => item.status === "confirmed" && new Date(item.ends_at).getTime() > now.getTime())
    .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at))[0] ?? null;
}

export function dayRevenue(items: { status: string; price_cents: number | null }[]) {
  return items.filter((item) => item.status === "confirmed").reduce((sum, item) => sum + (item.price_cents ?? 0), 0);
}

export type FreeGap = { starts_at: string; ends_at: string };

/** Trous encore libres entre l'ouverture et la fermeture. null si les horaires manquent. */
export function freeGaps(args: {
  open: string;
  close: string;
  busy: { starts_at: string; ends_at: string }[];
  now?: Date;
  minMinutes?: number;
}): FreeGap[] {
  const openMs = new Date(args.open).getTime();
  const closeMs = new Date(args.close).getTime();
  if (!Number.isFinite(openMs) || !Number.isFinite(closeMs) || closeMs <= openMs) return [];
  const minMs = (args.minMinutes ?? 30) * 60_000;
  let cursor = Math.max(openMs, args.now?.getTime() ?? openMs);
  if (cursor >= closeMs) return [];
  const busy = args.busy
    .map((item) => ({ start: new Date(item.starts_at).getTime(), end: new Date(item.ends_at).getTime() }))
    .filter((item) => item.end > cursor && item.start < closeMs)
    .sort((a, b) => a.start - b.start);
  const gaps: FreeGap[] = [];
  for (const item of busy) {
    const gapEnd = Math.min(item.start, closeMs);
    if (gapEnd - cursor >= minMs) gaps.push({ starts_at: new Date(cursor).toISOString(), ends_at: new Date(gapEnd).toISOString() });
    cursor = Math.max(cursor, item.end);
    if (cursor >= closeMs) return gaps;
  }
  if (closeMs - cursor >= minMs) gaps.push({ starts_at: new Date(cursor).toISOString(), ends_at: new Date(closeMs).toISOString() });
  return gaps;
}
