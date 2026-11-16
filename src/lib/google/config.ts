/**
 * Configuration de la connexion Google Agenda. Tout est livré, mais la fonction reste dormante
 * (aucun bouton, aucun appel Google) tant que GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET
 * ne sont pas posés sur le worker.
 */
import { parseTokenKey } from "./crypto";

export const GOOGLE_SCOPES = [
  "openid",
  "email",
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy",
] as const;

/** Scopes indispensables : sans eux (case décochée à l'écran de consentement), on refuse la connexion. */
export const REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/calendar.freebusy",
] as const;

export type GoogleEnv = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  NEXT_PUBLIC_SITE_URL?: string;
  EMAIL_QUEUE_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
  GOOGLE_TOKEN_KEY?: string;
};

export function googleConfigured(env: GoogleEnv): boolean {
  return Boolean(
    env.GOOGLE_CLIENT_ID?.trim() &&
      env.GOOGLE_CLIENT_SECRET?.trim() &&
      parseTokenKey(env.GOOGLE_TOKEN_KEY) &&
      env.EMAIL_QUEUE_SECRET &&
      env.NEXT_PUBLIC_SUPABASE_URL &&
      env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function siteUrlFrom(env: GoogleEnv): string {
  return (env.NEXT_PUBLIC_SITE_URL?.trim() || "https://sheensy.com").replace(/\/$/, "");
}

export function redirectUri(env: GoogleEnv): string {
  return env.GOOGLE_REDIRECT_URI?.trim() || `${siteUrlFrom(env)}/api/google/callback`;
}

/** Variables lues à l'exécution (secrets du worker exposés par OpenNext dans process.env). */
export function processGoogleEnv(): GoogleEnv {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    EMAIL_QUEUE_SECRET: process.env.EMAIL_QUEUE_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
    GOOGLE_TOKEN_KEY: process.env.GOOGLE_TOKEN_KEY,
  };
}
