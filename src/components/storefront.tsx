"use client";

import { useState } from "react";
import { BookingWidget } from "@/components/booking-widget";
import { weekdayName } from "@/lib/dates";
import { formatDuration } from "@/lib/dates";
import { formatEuro } from "@/lib/money";
import { formatPhone, telHref } from "@/lib/phone";
import { initials } from "@/lib/phone";
import { hasReviews, mapsSearchUrl } from "@/lib/storefront";
import type { BookingContext, PublicReview } from "@/lib/types";

export function Storefront({ page, slug }: { page: BookingContext; slug: string }) {
  const [tab, setTab] = useState<"rdv" | "avis" | "propos">("rdv");
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [photo, setPhoto] = useState(0);
  const [saved, setSaved] = useState(false);
  const photos = page.photos ?? [];
  const count = photos.length;
  const current = photos[photo];
  const reviews = page.reviews ?? [];
  const reviewCount = page.review_count ?? reviews.length;
  const maps = mapsSearchUrl(page.address, page.city);
  const addressLine = [page.address, page.city].filter(Boolean).join(", ");

  async function share() {
    const url = window.location.href;
    const payload = { title: page.full_name, text: `Réservez chez ${page.full_name}`, url };
    if (navigator.share) {
      try { await navigator.share(payload); return; } catch { /* copie ensuite */ }
    }
    await navigator.clipboard.writeText(url);
  }

  return (
    <div className="min-h-screen bg-white text-slate-800">
      <div className="relative h-64 bg-[radial-gradient(circle_at_30%_20%,#f9a8d4_0%,#818cf8_42%,#4f46e5_100%)] sm:h-80">
        {current ? (
          <img src={current.url} alt={current.caption ?? page.full_name} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-24 w-24 items-center justify-center rounded-full bg-white/20 text-5xl font-extrabold text-white">{initials(page.full_name)}</span>
          </div>
        )}
        <div className="absolute right-3 top-3 flex gap-2">
          <button type="button" onClick={() => void share()} className="h-10 w-10 rounded-full bg-white/90 text-lg shadow" aria-label="Partager">↗</button>
          <button type="button" onClick={() => setSaved((value) => !value)} className={`h-10 w-10 rounded-full bg-white/90 text-lg shadow ${saved ? "text-rose-500" : "text-slate-700"}`} aria-label="Favori">{saved ? "♥" : "♡"}</button>
        </div>
        {count > 1 ? (
          <>
            <button type="button" className="absolute left-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-white/90 font-bold" aria-label="Photo précédente" onClick={() => setPhoto((index) => (index - 1 + count) % count)}>‹</button>
            <button type="button" className="absolute right-3 top-1/2 h-9 w-9 -translate-y-1/2 rounded-full bg-white/90 font-bold" aria-label="Photo suivante" onClick={() => setPhoto((index) => (index + 1) % count)}>›</button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2 py-0.5 text-xs font-semibold text-white">{photo + 1}/{count}</span>
          </>
        ) : null}
      </div>

      <div className="px-4 pt-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{page.full_name}</h1>
        {addressLine && maps ? (
          <a href={maps} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-start gap-1.5 text-sm text-slate-600">
            <span aria-hidden="true">📍</span>
            <span className="underline decoration-slate-300">{addressLine}</span>
          </a>
        ) : null}
        {hasReviews(reviewCount) ? (
          <p className="mt-2 text-sm font-semibold text-slate-900">★ {Number(page.rating_avg ?? 0).toLocaleString("fr-FR")} <span className="font-normal text-slate-500">({reviewCount} avis)</span></p>
        ) : null}
      </div>

      <div className="sticky top-0 z-20 mt-4 grid grid-cols-3 border-b border-slate-200 bg-white text-sm font-semibold">
        {([["rdv", "Prendre RDV"], ["avis", "Avis"], ["propos", "À propos"]] as const).map(([id, label]) => (
          <button key={id} type="button" onClick={() => { setTab(id); setServiceId(null); }} className={`h-11 ${tab === id ? "border-b-2 border-slate-900 text-slate-900" : "text-slate-400"}`}>{label}</button>
        ))}
      </div>

      <div className="px-4 py-4">
        {tab === "rdv" ? (
          serviceId ? (
            <BookingWidget slug={slug} services={page.services} focusId={serviceId} onBack={() => setServiceId(null)} />
          ) : page.services.length === 0 ? (
            <p className="text-sm text-slate-500">Aucune prestation pour le moment.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {page.services.map((service) => (
                <li key={service.id} className="flex items-center gap-3 py-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{service.name}</p>
                    {service.description ? <p className="text-sm text-slate-400">{service.description}</p> : null}
                    <p className="text-sm text-slate-600">{formatEuro(service.price_cents)} • {formatDuration(service.duration_min)}</p>
                  </div>
                  <button type="button" onClick={() => setServiceId(service.id)} className="h-9 shrink-0 rounded-full bg-slate-900 px-4 text-sm font-semibold text-white">Choisir</button>
                </li>
              ))}
            </ul>
          )
        ) : null}
        {tab === "avis" ? <Reviews reviews={reviews} /> : null}
        {tab === "propos" ? <About page={page} /> : null}
      </div>
    </div>
  );
}

function Reviews({ reviews }: { reviews: PublicReview[] }) {
  if (reviews.length === 0) {
    return (
      <div className="rounded-3xl bg-slate-50 px-4 py-8 text-center">
        <p className="text-2xl">✦</p>
        <p className="mt-2 font-semibold text-slate-900">Pas encore d’avis</p>
        <p className="mt-1 text-sm text-slate-500">Les premières clientes pourront raconter leur rendez-vous ici.</p>
      </div>
    );
  }
  return (
    <ul className="space-y-4">
      {reviews.map((review) => (
        <li key={review.id}>
          <p className="font-semibold text-slate-900">{review.author_name} <span className="text-amber-500">{"★".repeat(review.rating)}</span></p>
          {review.body ? <p className="mt-1 text-sm text-slate-600">{review.body}</p> : null}
        </li>
      ))}
    </ul>
  );
}

function About({ page }: { page: BookingContext }) {
  const maps = mapsSearchUrl(page.address, page.city);
  return (
    <div className="space-y-5 text-sm">
      {page.bio ? <p className="leading-relaxed text-slate-700">{page.bio}</p> : <p className="text-slate-500">Pas encore de description.</p>}
      <section>
        <h2 className="font-bold text-slate-900">Horaires</h2>
        <dl className="mt-2 space-y-1">
          {page.hours.map((hour) => (
            <div key={hour.isodow} className="flex justify-between">
              <dt>{weekdayName(hour.isodow)}</dt>
              <dd className={hour.is_closed ? "text-slate-400" : ""}>{hour.is_closed ? "Fermé" : `${hour.opens} – ${hour.closes}`}</dd>
            </div>
          ))}
        </dl>
      </section>
      {page.address || page.city ? (
        <section>
          <h2 className="font-bold text-slate-900">Adresse</h2>
          {maps ? <a className="mt-1 block text-brand-700" href={maps} target="_blank" rel="noreferrer">{[page.address, page.city].filter(Boolean).join(", ")}</a> : null}
        </section>
      ) : null}
      {page.phone ? (
        <section>
          <h2 className="font-bold text-slate-900">Téléphone</h2>
          <a className="mt-1 block text-brand-700" href={telHref(page.phone)}>{formatPhone(page.phone)}</a>
        </section>
      ) : null}
    </div>
  );
}
