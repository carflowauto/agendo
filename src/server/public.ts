"use server";

import { dbError } from "@/lib/db-error";
import { addDays, isDateKey, TIME_ZONE, zonedWallTimeToUtc } from "@/lib/dates";
import { buildSlots, hourForDate } from "@/lib/slots";
import { createClient } from "@/lib/supabase/server";
import type { BookingContext, BookingResult } from "@/lib/types";

export type DaySlots = { closed: boolean; slots: string[] };

export async function getWeekSlots(slug: string, serviceId: string, startDate: string) {
  const empty: Record<string, DaySlots> = {};
  if (!isDateKey(startDate)) return { error: "Date invalide.", slots: empty };
  const supabase = await createClient();
  const from = zonedWallTimeToUtc(startDate, "00:00");
  const to = zonedWallTimeToUtc(addDays(startDate, 7), "00:00");
  const { data, error } = await supabase.rpc("get_booking_context", {
    p_slug: slug,
    p_from: from.toISOString(),
    p_to: to.toISOString(),
  });
  if (error) return { error: dbError(error), slots: empty };
  const ctx = data as BookingContext | null;
  if (!ctx) return { error: "Page introuvable.", slots: empty };
  const service = ctx.services.find((item) => item.id === serviceId);
  if (!service) return { error: "Prestation introuvable.", slots: empty };

  const slots: Record<string, DaySlots> = {};
  for (let i = 0; i < 7; i++) {
    const date = addDays(startDate, i);
    const hour = hourForDate(ctx.hours, date);
    const closed = !hour || hour.is_closed;
    slots[date] = {
      closed,
      slots: buildSlots({
        date,
        timeZone: ctx.timezone || TIME_ZONE,
        durationMin: service.duration_min,
        opens: hour?.opens ?? null,
        closes: hour?.closes ?? null,
        isClosed: closed,
        minNoticeMinutes: ctx.min_notice_minutes,
        busy: ctx.busy ?? [],
        timeOff: ctx.time_off ?? [],
      }),
    };
  }
  return { slots };
}

export async function bookPublic(input: {
  slug: string;
  serviceId: string;
  startsAt: string;
  name: string;
  phone: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("book_public_appointment", {
    p_slug: input.slug,
    p_service_id: input.serviceId,
    p_starts_at: input.startsAt,
    p_client_name: input.name.trim(),
    p_client_phone: input.phone.trim(),
  });
  if (error) return { error: dbError(error) };
  return { booking: data as BookingResult };
}

export async function acceptInvitation(input: {
  token: string;
  startsAt: string;
  name: string;
  phone: string;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_invitation", {
    p_token: input.token,
    p_starts_at: input.startsAt,
    p_client_name: input.name.trim(),
    p_client_phone: input.phone.trim(),
  });
  if (error) return { error: dbError(error) };
  return { booking: data as BookingResult };
}
