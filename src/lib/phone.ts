export function phoneDigits(phone: string) {
  let d = phone.replace(/\D/g, "");
  if (d.startsWith("0033") && d.length > 4) d = `0${d.slice(4)}`;
  else if (d.startsWith("33") && d.length === 11) d = `0${d.slice(2)}`;
  return d;
}

export function formatPhone(phone: string) {
  const d = phoneDigits(phone);
  if (d.length === 10) return d.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  return phone.trim();
}

export function waDigits(phone: string) {
  const d = phoneDigits(phone);
  if (d.startsWith("0")) return `33${d.slice(1)}`;
  return d;
}

export function telHref(phone: string) {
  return `tel:${phone.replace(/\s/g, "")}`;
}

export function waHref(phone: string, text?: string) {
  const digits = waDigits(phone);
  const base = digits ? `https://wa.me/${digits}` : "https://wa.me/";
  if (!text) return base;
  return `${base}?text=${encodeURIComponent(text)}`;
}

export function firstName(full: string) {
  return full.trim().split(/\s+/)[0] || full;
}

export function initials(full: string) {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  const letters = (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
  return (letters || "A").toUpperCase();
}
