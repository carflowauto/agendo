"use client";

import { useEffect, useState } from "react";
import { addDays, formatDayLong, formatDayShort, formatDuration, formatTime, mondayOf, parisDateKey } from "@/lib/dates";
import { formatEuro } from "@/lib/money";
import { bookPublic, getWeekSlots, type DaySlots } from "@/server/public";
import type { BookingResult, PublicService } from "@/lib/types";
import { btnPrimary, fieldClass, labelClass } from "@/components/ui";

export function BookingWidget({ slug, services }: { slug: string; services: PublicService[] }) {
  const today = parisDateKey();
  const [serviceId, setServiceId] = useState(services[0]?.id ?? "");
  const [weekStart, setWeekStart] = useState(mondayOf(today));
  const [days, setDays] = useState<Record<string, DaySlots>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [booking, setBooking] = useState<BookingResult | null>(null);
  const service = services.find((item) => item.id === serviceId) ?? null;

  useEffect(() => {
    if (!serviceId) return;
    let cancelled = false;
    setLoading(true);
    void getWeekSlots(slug, serviceId, weekStart).then((result) => {
      if (cancelled) return;
      setLoading(false);
      if (result.error) setError(result.error);
      else {
        setError(null);
        setDays(result.slots);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [slug, serviceId, weekStart]);

  if (booking) {
    return (
      <section className="bg-white rounded-2xl border border-slate-200 p-6">
        <p className="text-sm font-semibold text-emerald-700">Rendez-vous confirmé</p>
        <h2 className="mt-2 text-2xl font-extrabold text-slate-900">{booking.service_name}</h2>
        <p className="mt-2 text-slate-600">
          {formatDayLong(booking.starts_at)} · {formatTime(booking.starts_at)} – {formatTime(booking.ends_at)}
        </p>
        <p className="mt-1 text-slate-600">{formatDuration(booking.duration_min)} · {formatEuro(booking.price_cents)}</p>
        <p className="mt-4 text-sm text-slate-500">
          Avec {booking.pro_name}
          {booking.address ? ` · ${booking.address}` : ""}
          {booking.city ? `, ${booking.city}` : ""}
        </p>
      </section>
    );
  }

  const dates = Array.from({ length: 7 }, (_, index) => addDays(weekStart, index));

  return (
    <div className="space-y-6">
      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <h2 className="text-lg font-bold text-slate-900">1. Choisissez une prestation</h2>
        <div className="mt-4 divide-y divide-slate-100">
          {services.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => { setServiceId(item.id); setSelected(null); }}
              className={`w-full flex items-center gap-4 py-3 text-left ${serviceId === item.id ? "bg-brand-50 -mx-3 px-3 rounded-xl" : ""}`}
            >
              <span className="flex-1">
                <span className="block font-semibold text-slate-900">{item.name}</span>
                {item.description ? <span className="block text-sm text-slate-500">{item.description}</span> : null}
              </span>
              <span className="text-sm text-slate-500">{formatDuration(item.duration_min)}</span>
              <span className="text-sm font-semibold text-slate-900">{formatEuro(item.price_cents)}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">2. Choisissez un créneau</h2>
          <div className="flex items-center gap-2">
            <button type="button" className="w-9 h-9 rounded-lg border border-slate-200" disabled={weekStart <= mondayOf(today)} onClick={() => setWeekStart(addDays(weekStart, -7))} aria-label="Semaine précédente">‹</button>
            <button type="button" className="w-9 h-9 rounded-lg border border-slate-200" onClick={() => setWeekStart(addDays(weekStart, 7))} aria-label="Semaine suivante">›</button>
          </div>
        </div>
        {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
        <div className="mt-4 overflow-x-auto">
          <div className="grid grid-cols-7 gap-2 min-w-[640px]">
            {dates.map((date) => {
              const day = days[date];
              return (
                <div key={date} className="text-center">
                  <p className="text-xs font-semibold text-slate-500 uppercase">{formatDayShort(date)}</p>
                  <div className="mt-2 space-y-1.5">
                    {loading && !day ? <div className="h-9 rounded-lg bg-slate-100" /> : null}
                    {day?.closed ? <div className="hatch rounded-lg h-16 flex items-center justify-center text-[11px] text-slate-400">Fermé</div> : null}
                    {day && !day.closed && day.slots.length === 0 ? <p className="text-[11px] text-slate-400">Complet</p> : null}
                    {day?.slots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelected(slot)}
                        className={`w-full h-9 rounded-lg text-sm font-semibold ${selected === slot ? "grad text-white" : "bg-brand-50 text-brand-700 hover:bg-brand-100"}`}
                      >
                        {formatTime(slot)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className={`bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 ${selected ? "" : "opacity-60"}`}>
        <h2 className="text-lg font-bold text-slate-900">3. Vos coordonnées</h2>
        {selected && service ? (
          <p className="mt-2 text-sm text-slate-600">{service.name} · {formatDayLong(selected)} à {formatTime(selected)}</p>
        ) : (
          <p className="mt-2 text-sm text-slate-500">Sélectionnez d’abord un créneau.</p>
        )}
        <form
          className="mt-4 grid sm:grid-cols-2 gap-3"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!selected || !serviceId) return;
            setPending(true);
            setError(null);
            const form = new FormData(event.currentTarget);
            const result = await bookPublic({
              slug,
              serviceId,
              startsAt: selected,
              name: String(form.get("name") ?? ""),
              phone: String(form.get("phone") ?? ""),
            });
            setPending(false);
            if (result.error) setError(result.error);
            else if (result.booking) setBooking(result.booking);
          }}
        >
          <label className={labelClass}>Nom<input name="name" required disabled={!selected} className={fieldClass} /></label>
          <label className={labelClass}>Téléphone<input name="phone" required disabled={!selected} className={fieldClass} placeholder="06…" /></label>
          <div className="sm:col-span-2">
            <button className={btnPrimary} disabled={!selected || pending}>{pending ? "Confirmation…" : "Confirmer le rendez-vous"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}
