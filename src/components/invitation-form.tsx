"use client";

import { useState } from "react";
import { formatDayLong, formatDuration, formatTime } from "@/lib/dates";
import { formatEuro } from "@/lib/money";
import { acceptInvitation } from "@/server/public";
import type { BookingResult } from "@/lib/types";
import { btnPrimary, fieldClass, labelClass } from "@/components/ui";

export function InvitationForm({
  token,
  slots,
  service,
  consumed,
  expired,
}: {
  token: string;
  slots: string[];
  service: { name: string; duration_min: number; price_cents: number } | null;
  consumed: boolean;
  expired: boolean;
}) {
  const [selected, setSelected] = useState(slots[0] ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [booking, setBooking] = useState<BookingResult | null>(null);

  if (booking) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6">
        <p className="text-sm font-semibold text-emerald-700">C’est confirmé</p>
        <h2 className="mt-2 text-2xl font-extrabold">{booking.service_name}</h2>
        <p className="mt-2 text-slate-600">{formatDayLong(booking.starts_at)} à {formatTime(booking.starts_at)}</p>
        <p className="text-sm text-slate-500 mt-1">Avec {booking.pro_name}</p>
      </div>
    );
  }
  if (consumed) return <p className="rounded-xl bg-slate-100 px-4 py-3 text-sm">Cette invitation a déjà été utilisée.</p>;
  if (expired) return <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-900">Cette invitation a expiré.</p>;

  return (
    <form
      className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        const form = new FormData(event.currentTarget);
        const result = await acceptInvitation({
          token,
          startsAt: selected,
          name: String(form.get("name") ?? ""),
          phone: String(form.get("phone") ?? ""),
        });
        setPending(false);
        if (result.error) setError(result.error);
        else if (result.booking) setBooking(result.booking);
      }}
    >
      {service ? (
        <p className="text-sm text-slate-600">{service.name} · {formatDuration(service.duration_min)} · {formatEuro(service.price_cents)}</p>
      ) : null}
      <div className="space-y-2">
        {slots.map((slot) => (
          <label key={slot} className={`flex items-center gap-3 rounded-xl border px-3 py-3 ${selected === slot ? "border-brand-500 bg-brand-50" : "border-slate-200"}`}>
            <input type="radio" name="slot" checked={selected === slot} onChange={() => setSelected(slot)} />
            <span className="text-sm font-semibold capitalize">{formatDayLong(slot)} · {formatTime(slot)}</span>
          </label>
        ))}
      </div>
      <label className={labelClass}>Nom<input name="name" required className={fieldClass} /></label>
      <label className={labelClass}>Téléphone<input name="phone" required className={fieldClass} /></label>
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      <button className={btnPrimary} disabled={pending || !selected}>{pending ? "Confirmation…" : "Confirmer ce créneau"}</button>
    </form>
  );
}
