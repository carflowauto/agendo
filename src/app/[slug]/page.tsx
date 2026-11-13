import { notFound } from "next/navigation";
import { BookingWidget } from "@/components/booking-widget";
import { Logo } from "@/components/ui";
import { weekdayName } from "@/lib/dates";
import { hasSupabaseEnv } from "@/lib/env";
import { formatPhone, telHref } from "@/lib/phone";
import { initials } from "@/lib/phone";
import { createClient } from "@/lib/supabase/server";
import { RESERVED_SLUGS, type BookingContext } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return { title: slug };
}

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (RESERVED_SLUGS.has(slug) || !hasSupabaseEnv()) notFound();
  const supabase = await createClient();
  const from = new Date();
  const to = new Date(Date.now() + 21 * 24 * 3600 * 1000);
  const { data } = await supabase.rpc("get_booking_context", {
    p_slug: slug,
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  const page = data as BookingContext | null;
  if (!page) notFound();
  const hours = [...page.hours].sort((a, b) => a.isodow - b.isodow);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <Logo compact href="/" />
          <span className="text-xs text-slate-500">Réservation sans compte</span>
        </div>
      </header>
      <section className="max-w-6xl mx-auto px-4 pt-6">
        <div className="relative rounded-2xl overflow-hidden h-36 grad">
          {page.photos[0] ? <img src={page.photos[0].url} alt="" className="absolute inset-0 w-full h-full object-cover opacity-50" /> : null}
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 -mt-8 relative mx-3 sm:mx-6 p-5 shadow-sm flex flex-col md:flex-row gap-5">
          <span className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-400 to-brand-500 text-white text-xl font-extrabold flex items-center justify-center ring-4 ring-white">
            {initials(page.full_name)}
          </span>
          <div className="flex-1">
            <h1 className="text-2xl font-extrabold text-slate-900">{page.full_name}</h1>
            <p className="text-slate-600">{page.profession}{page.city ? ` · ${page.city}` : ""}</p>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
              {page.address ? <span>{page.address}</span> : null}
              {page.phone ? <a className="font-semibold text-brand-700" href={telHref(page.phone)}>{formatPhone(page.phone)}</a> : null}
            </div>
            {page.bio ? <p className="mt-3 text-sm text-slate-600">{page.bio}</p> : null}
          </div>
          <dl className="md:w-56 text-sm bg-slate-50 rounded-xl px-4 py-3">
            {hours.map((hour) => (
              <div key={hour.isodow} className="flex justify-between gap-3 py-0.5">
                <dt>{weekdayName(hour.isodow)}</dt>
                <dd className={hour.is_closed ? "text-slate-400" : ""}>{hour.is_closed ? "Fermé" : `${hour.opens} – ${hour.closes}`}</dd>
              </div>
            ))}
          </dl>
        </div>
        {page.photos.length > 1 ? (
          <div className="mt-4 grid grid-cols-3 gap-2">
            {page.photos.slice(0, 6).map((photo) => (
              <img key={photo.url} src={photo.url} alt={photo.caption ?? ""} className="h-28 w-full object-cover rounded-xl" />
            ))}
          </div>
        ) : null}
      </section>
      <main className="max-w-6xl mx-auto px-4 py-8">
        {page.services.length === 0 ? (
          <p className="text-slate-500">Aucune prestation n’est proposée pour le moment.</p>
        ) : (
          <BookingWidget slug={slug} services={page.services} />
        )}
      </main>
    </div>
  );
}
