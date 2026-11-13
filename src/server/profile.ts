import { redirect } from "next/navigation";
import { dbError } from "@/lib/db-error";
import { hasSupabaseEnv } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export async function getSessionProfile() {
  if (!hasSupabaseEnv()) {
    return {
      user: null,
      profile: null as Profile | null,
      configError:
        "Les variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY sont absentes au moment du build.",
    };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null as Profile | null, configError: null as string | null };
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  return {
    user,
    profile: (data as Profile | null) ?? null,
    configError: error ? dbError(error) : null,
  };
}

export async function requireProfile() {
  const session = await getSessionProfile();
  if (!session.user) redirect("/connexion");
  if (!session.profile) redirect("/espace/aujourdhui");
  const supabase = await createClient();
  return { supabase, user: session.user, profile: session.profile };
}
