"use client";

import { createBrowserClient } from "@supabase/ssr";
import { hasSupabaseEnv, supabaseAnonKey, supabaseUrl } from "@/lib/env";

export function createClient() {
  if (!hasSupabaseEnv()) {
    throw new Error("Configuration Supabase incomplète.");
  }
  return createBrowserClient(supabaseUrl(), supabaseAnonKey());
}
