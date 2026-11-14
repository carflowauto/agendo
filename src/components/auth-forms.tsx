"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/env";
import { siteUrl } from "@/lib/site";
import { btnPrimary, ConfigMissing, fieldClass, labelClass } from "@/components/ui";

function mapAuth(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login")) return "E-mail ou mot de passe incorrect.";
  if (lower.includes("already registered") || lower.includes("already been registered")) return "Un compte existe déjà avec cet e-mail.";
  if (lower.includes("password")) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (lower.includes("email")) return "Adresse e-mail invalide.";
  if (lower.includes("rate")) return "Trop de tentatives. Réessayez dans quelques minutes.";
  return message;
}

export function LoginForm({ suivant }: { suivant: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  if (!hasSupabaseEnv()) return <ConfigMissing />;

  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        const form = new FormData(event.currentTarget);
        const supabase = createClient();
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: String(form.get("email") ?? "").trim(),
          password: String(form.get("password") ?? ""),
        });
        if (authError) {
          setError(mapAuth(authError.message));
          setPending(false);
          return;
        }
        const next = suivant.startsWith("/") && !suivant.startsWith("//") ? suivant : "/espace/aujourdhui";
        window.location.assign(next);
      }}
    >
      {error ? <p className="rounded-xl bg-rose-50 text-rose-700 text-sm px-4 py-3">{error}</p> : null}
      <label className={labelClass}>
        E-mail
        <input name="email" type="email" required autoComplete="email" className={fieldClass} />
      </label>
      <label className={labelClass}>
        Mot de passe
        <input name="password" type="password" required autoComplete="current-password" minLength={8} className={fieldClass} />
      </label>
      <button className={`${btnPrimary} w-full`} disabled={pending}>
        {pending ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}

export function ForgotForm() {
  const [info, setInfo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!hasSupabaseEnv()) return <ConfigMissing />;
  return (
    <form
      className="space-y-4"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
        const supabase = createClient();
        const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${siteUrl()}/auth/callback?next=/espace/reglages`,
        });
        if (authError) setError(mapAuth(authError.message));
        else setInfo("Si un compte existe avec cet e-mail, un lien de réinitialisation vient d’être envoyé.");
      }}
    >
      {error ? <p className="rounded-xl bg-rose-50 text-rose-700 text-sm px-4 py-3">{error}</p> : null}
      {info ? <p className="rounded-xl bg-emerald-50 text-emerald-800 text-sm px-4 py-3">{info}</p> : null}
      <label className={labelClass}>E-mail<input name="email" type="email" required className={fieldClass} /></label>
      <button className={`${btnPrimary} w-full`}>Envoyer le lien</button>
    </form>
  );
}

export function PasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      className="space-y-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setError(null);
        setMessage(null);
        const password = String(new FormData(event.currentTarget).get("password") ?? "");
        if (password.length < 8) {
          setError("8 caractères minimum.");
          return;
        }
        const supabase = createClient();
        const { error: authError } = await supabase.auth.updateUser({ password });
        if (authError) setError(mapAuth(authError.message));
        else setMessage("Mot de passe mis à jour.");
      }}
    >
      {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
      <label className={labelClass}>Nouveau mot de passe<input name="password" type="password" minLength={8} required className={fieldClass} /></label>
      <button className={btnPrimary}>Mettre à jour</button>
    </form>
  );
}
