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
