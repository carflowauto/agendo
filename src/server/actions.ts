"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { dbError } from "@/lib/db-error";
import { hasSupabaseEnv } from "@/lib/env";
import { eurosToCents } from "@/lib/money";
import { phoneDigits } from "@/lib/phone";
import { isDateKey, zonedWallTimeToUtc } from "@/lib/dates";
import { requestOrigin } from "@/lib/origin";
import { createClient } from "@/lib/supabase/server";
import { RESERVED_SLUGS } from "@/lib/types";
import { requireProfile } from "@/server/profile";

function go(path: string, error?: string | null): never {
  if (error) redirect(`${path}?erreur=${encodeURIComponent(error)}`);
  redirect(`${path}?ok=1`);
}

function catalogPath(formData: FormData) {
  const back = String(formData.get("retour") ?? "/espace/reglages");
  if (back === "/espace/ma-page" || back === "/espace/reglages" || back.startsWith("/espace/reglages/")) return back;
  return "/espace/reglages";
}

async function findOrCreateClient(
  supabase: Awaited<ReturnType<typeof requireProfile>>["supabase"],
  profileId: string,
  name: string,
  phone: string,
  email?: string,
) {
  const digits = phoneDigits(phone);
  if (name.trim().length < 2) throw new Error("Indiquez le nom de la cliente.");
  if (digits.length < 8) throw new Error("Indiquez un téléphone valide.");
  const { data: existing, error: listError } = await supabase
    .from("clients")
    .select("id, phone")
    .eq("profile_id", profileId);
  if (listError) throw new Error(dbError(listError));
  const found = (existing ?? []).find((row) => phoneDigits(String(row.phone)) === digits);
  if (found) {
    const { error } = await supabase
      .from("clients")
      .update({ full_name: name.trim(), phone: phone.trim(), ...(email ? { email: email.trim() } : {}) })
      .eq("id", found.id);
    if (error) throw new Error(dbError(error));
    return String(found.id);
  }
  const { data, error } = await supabase
    .from("clients")
    .insert({
      profile_id: profileId,
      full_name: name.trim(),
      phone: phone.trim(),
      email: email?.trim() || null,
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(dbError(error));
  return String(data.id);
}

export async function signOut() {
  if (hasSupabaseEnv()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  redirect("/");
}

export async function loadDemo() {
  const { supabase } = await requireProfile();
  const { error } = await supabase.rpc("seed_demo_data");
  if (error) go("/espace/aujourdhui", dbError(error));
  revalidatePath("/espace/aujourdhui");
  revalidatePath("/espace/agenda");
  revalidatePath("/espace/clientes");
  redirect("/espace/aujourdhui?ok=Exemple%20charg%C3%A9");
}

export async function cancelAppointment(formData: FormData) {
  const { supabase, profile } = await requireProfile();
  const id = String(formData.get("id") ?? "");
  const back = String(formData.get("back") ?? "/espace/aujourdhui");
  const safe = back.startsWith("/espace") ? back : "/espace/aujourdhui";
  const { error } = await supabase
    .from("appointments")
    .update({ status: "cancelled" })
    .eq("id", id)
    .eq("profile_id", profile.id);
  if (error) go(safe, dbError(error));
  revalidatePath("/espace/aujourdhui");
  revalidatePath("/espace/agenda");
  redirect(`${safe}?ok=Rendez-vous%20annul%C3%A9`);
}

export async function moveAppointment(id: string, startsAtIso: string) {
  const { supabase, profile } = await requireProfile();
  const { data: current, error: readError } = await supabase
    .from("appointments")
    .select("starts_at, ends_at, status")
    .eq("id", id)
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (readError || !current) return { error: "Rendez-vous introuvable." };
  if (current.status === "cancelled") return { error: "Ce rendez-vous est annulé." };
  const start = new Date(startsAtIso);
  if (Number.isNaN(start.getTime())) return { error: "Horaire invalide." };
  const duration = new Date(String(current.ends_at)).getTime() - new Date(String(current.starts_at)).getTime();
  if (duration <= 0) return { error: "Durée invalide." };
  const end = new Date(start.getTime() + duration);
  const { error } = await supabase
    .from("appointments")
    .update({ starts_at: start.toISOString(), ends_at: end.toISOString() })
    .eq("id", id)
    .eq("profile_id", profile.id);
  if (error) return { error: dbError(error) };
  revalidatePath("/espace/agenda");
  revalidatePath("/espace/aujourdhui");
  return { ok: true as const };
}

export async function createAppointment(formData: FormData) {
  const { supabase, profile } = await requireProfile();
  const name = String(formData.get("name") ?? "");
  let phone = String(formData.get("phone") ?? "");
  const serviceId = String(formData.get("service_id") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();
  if (!isDateKey(date) || !/^\d{2}:\d{2}/.test(time)) go("/espace/agenda", "Date ou heure invalide.");
  if (!phone.trim()) {
    const { data: named } = await supabase
      .from("clients")
      .select("phone, full_name")
      .eq("profile_id", profile.id)
      .ilike("full_name", name.trim());
    if (named?.length === 1) phone = String(named[0].phone);
  }
  const { data: service, error: serviceError } = await supabase
    .from("services")
    .select("id, name, duration_min, price_cents")
    .eq("id", serviceId)
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (serviceError || !service) go("/espace/agenda", "Prestation introuvable.");
  try {
    const clientId = await findOrCreateClient(supabase, profile.id, name, phone);
    const start = zonedWallTimeToUtc(date, time.slice(0, 5), profile.timezone);
    const end = new Date(start.getTime() + Number(service.duration_min) * 60_000);
    const { error } = await supabase.from("appointments").insert({
      profile_id: profile.id,
      client_id: clientId,
      service_id: service.id,
      starts_at: start.toISOString(),
      ends_at: end.toISOString(),
      status: "confirmed",
      source: "manual",
      notes: notes || null,
      client_name: name.trim(),
      client_phone: phone.trim(),
      service_name: service.name,
      duration_min: service.duration_min,
      price_cents: service.price_cents,
    });
    if (error) go("/espace/agenda", dbError(error));
  } catch (error) {
    go("/espace/agenda", error instanceof Error ? error.message : "Impossible de créer le rendez-vous.");
  }
  revalidatePath("/espace/agenda");
  revalidatePath("/espace/aujourdhui");
  revalidatePath("/espace/clientes");
  redirect("/espace/agenda?ok=Rendez-vous%20ajout%C3%A9");
}

export async function createBlock(formData: FormData) {
  const { supabase, profile } = await requireProfile();
  const date = String(formData.get("date") ?? "");
  const startTime = String(formData.get("start") ?? "");
  const endTime = String(formData.get("end") ?? "");
  const label = String(formData.get("label") ?? "Indisponible").trim() || "Indisponible";
  if (!isDateKey(date) || !/^\d{2}:\d{2}/.test(startTime) || !/^\d{2}:\d{2}/.test(endTime)) {
    go("/espace/agenda", "Créneau invalide.");
  }
  const start = zonedWallTimeToUtc(date, startTime.slice(0, 5), profile.timezone);
  const end = zonedWallTimeToUtc(date, endTime.slice(0, 5), profile.timezone);
  if (end <= start) go("/espace/agenda", "L'heure de fin doit être après le début.");
  const { error } = await supabase.from("appointments").insert({
    profile_id: profile.id,
    starts_at: start.toISOString(),
    ends_at: end.toISOString(),
    status: "blocked",
    source: "block",
    service_name: label,
    notes: "Bloqué depuis l'agenda",
    duration_min: Math.round((end.getTime() - start.getTime()) / 60_000),
    price_cents: 0,
  });
  if (error) go("/espace/agenda", dbError(error));
  revalidatePath("/espace/agenda");
  revalidatePath("/espace/aujourdhui");
  redirect("/espace/agenda?ok=Cr%C3%A9neau%20bloqu%C3%A9");
}

export async function createInvitation(serviceId: string, slotsLocal: string[]) {
  const { supabase, profile } = await requireProfile();
  if (!serviceId) return { error: "Choisissez une prestation." };
  const iso = [
    ...new Set(
      slotsLocal
        .map((value) => {
          const [date, time] = value.split("T");
          if (!date || !time || !isDateKey(date)) return null;
          const instant = zonedWallTimeToUtc(date, time.slice(0, 5), profile.timezone);
          if (instant.getTime() < Date.now() - 60_000) return null;
          return instant.toISOString();
        })
        .filter((value): value is string => Boolean(value)),
    ),
  ].slice(0, 12);
  if (iso.length === 0) return { error: "Ajoutez au moins un créneau à venir." };
  const { data: service } = await supabase
    .from("services")
    .select("id")
    .eq("id", serviceId)
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!service) return { error: "Prestation introuvable." };
  const { data, error } = await supabase
    .from("invitations")
    .insert({ profile_id: profile.id, service_id: serviceId, slots: iso })
    .select("token")
    .single();
  if (error || !data) return { error: dbError(error) };
  const origin = await requestOrigin();
  revalidatePath("/espace/aujourdhui");
  return { url: `${origin}/invitation/${data.token}` };
}

export async function saveClient(formData: FormData) {
  const { supabase, profile } = await requireProfile();
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  if (name.length < 2 || phoneDigits(phone).length < 8) go(`/espace/clientes/${id}`, "Nom ou téléphone invalide.");
  if (id) {
    const { error } = await supabase
      .from("clients")
      .update({ full_name: name, phone, email: email || null, notes: notes || null })
      .eq("id", id)
      .eq("profile_id", profile.id);
    if (error) go(`/espace/clientes/${id}`, dbError(error));
    revalidatePath(`/espace/clientes/${id}`);
    redirect(`/espace/clientes/${id}?ok=1`);
  }
  const { data, error } = await supabase
    .from("clients")
    .insert({ profile_id: profile.id, full_name: name, phone, email: email || null, notes: notes || null })
    .select("id")
    .single();
  if (error || !data) go("/espace/clientes", dbError(error));
  revalidatePath("/espace/clientes");
  redirect(`/espace/clientes/${data.id}?ok=1`);
}

export async function saveBoutique(formData: FormData) {
  const { supabase, profile } = await requireProfile();
  const fullName = String(formData.get("full_name") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  if (fullName.length < 2) go("/espace/reglages/boutique", "Indiquez le nom de l’enseigne.");
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, city, phone, address: address || null })
    .eq("id", profile.id);
  if (error) go("/espace/reglages/boutique", dbError(error));
  revalidatePath("/espace/reglages/boutique");
  revalidatePath("/espace/ma-page");
  revalidatePath(`/${profile.slug}`);
  redirect("/espace/reglages/boutique?ok=1");
}

export async function saveProfile(formData: FormData) {
  const { supabase, profile } = await requireProfile();
  const slug = String(formData.get("slug") ?? "")
    .trim()
    .toLowerCase();
  const back = String(formData.get("retour") ?? "/espace/reglages");
  const path = back === "/espace/ma-page" || back === "/espace/reglages" ? back : "/espace/reglages";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length < 3 || RESERVED_SLUGS.has(slug)) {
    go(path, "Cette adresse de page est invalide ou réservée.");
  }
  const { data: taken } = await supabase.from("profiles").select("id").eq("slug", slug).neq("id", profile.id).maybeSingle();
  if (taken) go(path, "Cette adresse est déjà utilisée.");
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: String(formData.get("full_name") ?? "").trim(),
      profession: String(formData.get("profession") ?? "").trim(),
      city: String(formData.get("city") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      address: String(formData.get("address") ?? "").trim() || null,
      bio: String(formData.get("bio") ?? "").trim() || null,
      slug,
    })
    .eq("id", profile.id);
  if (error) go(path, dbError(error));
  revalidatePath("/espace/ma-page");
  revalidatePath("/espace/reglages");
  revalidatePath(`/${slug}`);
  redirect(`${path}?ok=1`);
}

export async function saveHours(formData: FormData) {
  const { supabase, profile } = await requireProfile();
  const back = catalogPath(formData);
  const rows = [1, 2, 3, 4, 5, 6, 7].map((isodow) => ({
    profile_id: profile.id,
    isodow,
    opens: String(formData.get(`opens_${isodow}`) ?? "09:30"),
    closes: String(formData.get(`closes_${isodow}`) ?? "18:30"),
    is_closed: formData.get(`closed_${isodow}`) === "on",
  }));
  const { error } = await supabase.from("opening_hours").upsert(rows, { onConflict: "profile_id,isodow" });
  if (error) go(back, dbError(error));
  revalidatePath("/espace/reglages");
  revalidatePath("/espace/ma-page");
  redirect(`${back}?ok=Horaires%20enregistr%C3%A9s`);
}

export async function saveService(formData: FormData) {
  const { supabase, profile } = await requireProfile();
  const back = catalogPath(formData);
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const duration = Number(formData.get("duration_min"));
  const cents = eurosToCents(String(formData.get("price") ?? ""));
  const description = String(formData.get("description") ?? "").trim();
  if (name.length < 2 || !Number.isFinite(duration) || duration < 5 || cents === null) {
    go(back, "Vérifiez le nom, la durée et le prix.");
  }
  const payload = { name, duration_min: Math.round(duration), price_cents: cents, description: description || null };
  const { error } = id
    ? await supabase.from("services").update(payload).eq("id", id).eq("profile_id", profile.id)
    : await supabase.from("services").insert({ ...payload, profile_id: profile.id, active: true });
  if (error) go(back, dbError(error));
  revalidatePath("/espace/reglages");
  revalidatePath("/espace/ma-page");
  redirect(`${back}?ok=1`);
}

export async function deleteService(formData: FormData) {
  const { supabase, profile } = await requireProfile();
  const back = catalogPath(formData);
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase.from("services").delete().eq("id", id).eq("profile_id", profile.id);
  if (error) go(back, dbError(error));
  revalidatePath("/espace/reglages");
  revalidatePath("/espace/ma-page");
  redirect(`${back}?ok=Prestation%20retir%C3%A9e`);
}

export async function addPhoto(formData: FormData) {
  const { supabase, profile } = await requireProfile();
  const url = String(formData.get("url") ?? "").trim();
  if (!/^https?:\/\//.test(url)) go("/espace/ma-page", "L'adresse de la photo doit commencer par http.");
  const { error } = await supabase.from("photos").insert({ profile_id: profile.id, url, caption: String(formData.get("caption") ?? "").trim() || null });
  if (error) go("/espace/ma-page", dbError(error));
  revalidatePath("/espace/ma-page");
  redirect("/espace/ma-page?ok=1");
}

export async function deletePhoto(formData: FormData) {
  const { supabase, profile } = await requireProfile();
  const id = String(formData.get("id") ?? "");
  const url = String(formData.get("url") ?? "");
  const marker = "/vitrine/";
  const index = url.indexOf(marker);
  if (index >= 0) {
    const path = decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
    await supabase.storage.from("vitrine").remove([path]);
  }
  const { error } = await supabase.from("photos").delete().eq("id", id).eq("profile_id", profile.id);
  if (error) go("/espace/ma-page", dbError(error));
  revalidatePath("/espace/ma-page");
  redirect("/espace/ma-page?ok=1");
}

export async function saveSettings(formData: FormData) {
  const { supabase, profile } = await requireProfile();
  const noticeHours = Number(formData.get("min_notice_hours"));
  const reminder = Number(formData.get("reminder_hours"));
  const refill = Number(formData.get("refill_weeks"));
  if (![noticeHours, reminder, refill].every(Number.isFinite)) go("/espace/reglages/preferences", "Valeur invalide.");
  const { error } = await supabase
    .from("profiles")
    .update({
      min_notice_minutes: Math.min(10080, Math.max(0, Math.round(noticeHours * 60))),
      reminder_hours: Math.min(168, Math.max(0, Math.round(reminder))),
      refill_weeks: Math.min(52, Math.max(1, Math.round(refill))),
    })
    .eq("id", profile.id);
  if (error) go("/espace/reglages/preferences", dbError(error));
  revalidatePath("/espace/reglages/preferences");
  revalidatePath("/espace/aujourdhui");
  redirect("/espace/reglages/preferences?ok=1");
}

export async function addTimeOff(formData: FormData) {
  const { supabase, profile } = await requireProfile();
  const starts = String(formData.get("starts_on") ?? "");
  const ends = String(formData.get("ends_on") ?? "");
  const reason = String(formData.get("reason") ?? "").trim();
  if (!isDateKey(starts) || !isDateKey(ends) || ends < starts) go("/espace/reglages/conges", "Période de congés invalide.");
  const { error } = await supabase.from("time_off").insert({
    profile_id: profile.id,
    starts_on: starts,
    ends_on: ends,
    reason: reason || null,
  });
  if (error) go("/espace/reglages/conges", dbError(error));
  revalidatePath("/espace/reglages/conges");
  redirect("/espace/reglages/conges?ok=Cong%C3%A9s%20ajout%C3%A9s");
}

export async function deleteTimeOff(formData: FormData) {
  const { supabase, profile } = await requireProfile();
  const id = String(formData.get("id") ?? "");
  const { error } = await supabase.from("time_off").delete().eq("id", id).eq("profile_id", profile.id);
  if (error) go("/espace/reglages/conges", dbError(error));
  revalidatePath("/espace/reglages/conges");
  redirect("/espace/reglages/conges?ok=1");
}
