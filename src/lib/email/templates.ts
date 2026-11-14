/**
 * Gabarits des e-mails transactionnels Sheensy (HTML + texte).
 * Fonctions pures : pas d'accès réseau, testables.
 */

export type EmailKind = "confirmation" | "reminder" | "pro_new_booking";

export type EmailJob = {
  id: string;
  kind: EmailKind;
  to_email: string;
  salon_name: string;
  slug: string;
  profession?: string | null;
  address?: string | null;
  city?: string | null;
  pro_phone?: string | null;
  pro_email?: string | null;
  timezone?: string | null;
  client_name?: string | null;
  client_phone?: string | null;
  client_email?: string | null;
  service_name?: string | null;
  starts_at: string;
  ends_at?: string | null;
  price_cents?: number | null;
  source?: string | null;
};

export type RenderedEmail = {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
};

export const SENDER_ADDRESS = "rendezvous@sheensy.com";
const ROSE = "#D9577A";
const PLUM = "#4A1238";
const MUTED = "#7A5A6B";
const SOFT = "#FBEFF3";

export function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Nom d'affichage sûr pour l'en-tête From (pas de guillemets, chevrons ni retours ligne). */
export function senderName(salon: string) {
  const clean = salon.replace(/[\r\n"<>\\]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  return `${clean || "Votre salon"} via Sheensy`;
}

export function fromHeader(salon: string) {
  return `"${senderName(salon)}" <${SENDER_ADDRESS}>`;
}

export function formatWhen(iso: string, timeZone = "Europe/Paris") {
  const date = new Date(iso);
  const day = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone }).format(date);
  const time = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone }).format(date).replace(":", "h");
  return { day: day.charAt(0).toUpperCase() + day.slice(1), time, full: `${day.charAt(0).toUpperCase() + day.slice(1)} à ${time}` };
}

export function formatPrice(cents?: number | null) {
  if (cents === null || cents === undefined || !Number.isFinite(cents) || cents <= 0) return null;
  const euros = cents / 100;
  return `${Number.isInteger(euros) ? euros.toString() : euros.toFixed(2).replace(".", ",")} €`;
}

function formatPhoneFr(phone?: string | null) {
  if (!phone) return "";
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return digits.replace(/(\d{2})(?=\d)/g, "$1 ").trim();
  return phone.trim();
}

function location(job: EmailJob) {
  return [job.address?.trim(), job.city?.trim()].filter(Boolean).join(", ");
}

export function salonUrl(siteUrl: string, slug: string) {
  return `${siteUrl.replace(/\/$/, "")}/${encodeURIComponent(slug)}`;
}

function row(label: string, value: string) {
  return `<tr><td style="padding:6px 0;color:${MUTED};font-size:14px;width:110px;vertical-align:top">${escapeHtml(label)}</td><td style="padding:6px 0;color:${PLUM};font-size:15px;font-weight:600">${escapeHtml(value)}</td></tr>`;
}

function layout(opts: { preheader: string; title: string; intro: string; rows: [string, string][]; ctaLabel?: string; ctaUrl?: string; footer: string }) {
  const rows = opts.rows.filter(([, v]) => v).map(([l, v]) => row(l, v)).join("");
  const cta = opts.ctaUrl && opts.ctaLabel
    ? `<tr><td style="padding:8px 28px 28px"><a href="${escapeHtml(opts.ctaUrl)}" style="display:inline-block;background:${ROSE};color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;padding:13px 22px;border-radius:12px">${escapeHtml(opts.ctaLabel)}</a></td></tr>`
    : "";
  return `<!doctype html>
<html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(opts.title)}</title></head>
<body style="margin:0;padding:0;background:${SOFT};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
<span style="display:none;max-height:0;overflow:hidden;opacity:0">${escapeHtml(opts.preheader)}</span>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:${SOFT}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:20px;overflow:hidden">
<tr><td style="padding:24px 28px 8px"><span style="font-size:26px;font-weight:800;letter-spacing:-0.5px;color:${ROSE}">Sheensy</span><span style="color:${ROSE};font-size:16px;vertical-align:top">&#10022;</span></td></tr>
<tr><td style="padding:8px 28px 0"><h1 style="margin:0;font-size:24px;line-height:1.25;color:${PLUM}">${escapeHtml(opts.title)}</h1></td></tr>
<tr><td style="padding:10px 28px 4px;color:${MUTED};font-size:15px;line-height:1.5">${escapeHtml(opts.intro)}</td></tr>
<tr><td style="padding:14px 28px 18px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-top:1px solid #F3DCE4;border-bottom:1px solid #F3DCE4">${rows}</table></td></tr>
${cta}
<tr><td style="padding:18px 28px 24px;background:#FDF6F8;color:${MUTED};font-size:12px;line-height:1.5">${escapeHtml(opts.footer)}</td></tr>
</table>
<p style="color:${MUTED};font-size:11px;margin:14px 0 0">Envoyé par Sheensy · sheensy.com</p>
</td></tr></table>
</body></html>`;
}

function textBlock(lines: [string, string][]) {
  return lines.filter(([, v]) => v).map(([l, v]) => `${l} : ${v}`).join("\n");
}

export function renderEmail(job: EmailJob, siteUrl = "https://sheensy.com"): RenderedEmail {
  const tz = job.timezone || "Europe/Paris";
  const when = formatWhen(job.starts_at, tz);
  const salon = job.salon_name?.trim() || "Votre salon";
  const service = job.service_name?.trim() || "Rendez-vous";
  const price = formatPrice(job.price_cents);
  const place = location(job);
  const url = salonUrl(siteUrl, job.slug);
  const proEmail = job.pro_email?.trim() || undefined;

  if (job.kind === "pro_new_booking") {
    const client = job.client_name?.trim() || "Une cliente";
    const rows: [string, string][] = [
      ["Cliente", client],
      ["Téléphone", formatPhoneFr(job.client_phone)],
      ["E-mail", job.client_email?.trim() || ""],
      ["Prestation", service],
      ["Date", when.day],
      ["Heure", when.time],
      ["Prix", price ?? ""],
    ];
    const via = job.source === "invitation" ? "via ton invitation" : "sur ta page Sheensy";
    const title = `Nouveau rendez-vous : ${client}`;
    return {
      from: `"Sheensy" <${SENDER_ADDRESS}>`,
      to: job.to_email,
      replyTo: job.client_email?.trim() || undefined,
      subject: `Nouveau RDV · ${client} · ${when.day} ${when.time}`,
      html: layout({
        preheader: `${client} a réservé ${service} le ${when.full}.`,
        title,
        intro: `${client} vient de réserver ${via}. Le rendez-vous est déjà dans ton agenda.`,
        rows,
        ctaLabel: "Ouvrir mon agenda",
        ctaUrl: `${siteUrl.replace(/\/$/, "")}/espace/aujourdhui`,
        footer: "Tu reçois cet e-mail parce qu’une cliente a réservé sur ton espace Sheensy.",
      }),
      text: `${title}\n\n${client} vient de réserver ${via}.\n\n${textBlock(rows)}\n\nTon agenda : ${siteUrl.replace(/\/$/, "")}/espace/aujourdhui\n\n— Sheensy`,
    };
  }

  const isReminder = job.kind === "reminder";
  const first = job.client_name?.trim().split(/\s+/)[0] || "";
  const hello = first ? `Bonjour ${first},` : "Bonjour,";
  const rows: [string, string][] = [
    ["Salon", salon],
    ["Prestation", service],
    ["Date", when.day],
    ["Heure", when.time],
    ["Adresse", place],
    ["Prix", price ?? ""],
    ["Téléphone", formatPhoneFr(job.pro_phone)],
  ];
  const title = isReminder ? "Petit rappel pour votre rendez-vous" : "Votre rendez-vous est confirmé";
  const intro = isReminder
    ? `${hello} on vous attend le ${when.day.toLowerCase()} à ${when.time} chez ${salon}.`
    : `${hello} votre rendez-vous chez ${salon} est bien réservé.`;
  const footer = `Un empêchement ? Prévenez ${salon} au plus tôt${job.pro_phone ? ` au ${formatPhoneFr(job.pro_phone)}` : ""}${proEmail ? " ou répondez à cet e-mail" : ""}.`;
  return {
    from: fromHeader(salon),
    to: job.to_email,
    replyTo: proEmail,
    subject: isReminder ? `Rappel · ${service} chez ${salon} · ${when.day} ${when.time}` : `Rendez-vous confirmé · ${service} chez ${salon} · ${when.day} ${when.time}`,
    html: layout({
      preheader: `${service} · ${when.full} · ${salon}`,
      title,
      intro,
      rows,
      ctaLabel: `Voir la page de ${salon}`,
      ctaUrl: url,
      footer,
    }),
    text: `${title}\n\n${intro}\n\n${textBlock(rows)}\n\nPage du salon : ${url}\n\n${footer}\n\n— Sheensy`,
  };
}
