import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

export const SALON_CATEGORIES = [
  { id: "ongles", label: "Ongles" },
  { id: "coiffure", label: "Coiffure" },
  { id: "maquillage", label: "Maquillage" },
  { id: "esthetique", label: "Esthétique" },
  { id: "injections", label: "Injections" },
] as const;

export type SalonCategory = (typeof SALON_CATEGORIES)[number]["id"];

export type PublicSalon = {
  slug: string;
  full_name: string;
  city: string;
  profession: string;
  cover_url: string | null;
};

export function isSalonCategory(value: string): value is SalonCategory {
  return SALON_CATEGORIES.some((item) => item.id === value);
}

/** Champs publics uniquement. Renvoie une liste vide si la recherche n’est pas encore disponible. */
export async function searchSalons(args: { query?: string; city?: string; category?: string; limit?: number }) {
  if (!hasSupabaseEnv()) return [] as PublicSalon[];
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_public_salons", {
    p_query: args.query ?? "",
    p_city: args.city ?? "",
    p_category: isSalonCategory(args.category ?? "") ? args.category : "",
    p_limit: args.limit ?? 12,
  });
  if (error || !Array.isArray(data)) return [] as PublicSalon[];
  return data.filter((row): row is PublicSalon => Boolean(row && typeof row.slug === "string" && typeof row.full_name === "string"));
}
