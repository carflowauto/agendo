"use server";

import { revalidatePath } from "next/cache";
import { dbError } from "@/lib/db-error";
import { requireProfile } from "@/server/profile";

const PATH = "/espace/reglages/synchronisation";

/** La pro a appuyé sur « Ajouter à mon iPhone » ou « Ajouter à Google Agenda ». */
export async function markCalendarConnected() {
  const { supabase } = await requireProfile();
  const { error } = await supabase.rpc("mark_calendar_connected");
  if (error) return { ok: false as const, error: dbError(error) };
  revalidatePath(PATH);
  return { ok: true as const };
}

/** Remplace le lien privé : l'ancien cesse de fonctionner immédiatement. */
export async function resetCalendarToken() {
  const { supabase } = await requireProfile();
  const { error } = await supabase.rpc("reset_calendar_token");
  if (error) return { ok: false as const, error: dbError(error) };
  revalidatePath(PATH);
  return { ok: true as const };
}
