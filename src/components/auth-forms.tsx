"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/env";
import { siteUrl } from "@/lib/site";
import { ConfigMissing } from "@/components/ui";
import { authButton, authInput, authLabel } from "@/components/auth-shell";

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
  const [visible, setVisible] = useState(false);
  if (!hasSupabaseEnv()) return <ConfigMissing />;

  return (
    <form
      className="mt-6"
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
      {error ? <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      <label className={authLabel}>
        E-mail
        <span className="relative mt-1.5 block">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#E23B6E]" strokeWidth={1.8} />
          <input name="email" type="email" required autoComplete="email" placeholder="vous@exemple.fr" className={`${authInput} pl-11`} />
        </span>
      </label>
      <label className={`${authLabel} mt-4`}>
        Mot de passe
        <span className="relative mt-1.5 block">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#E23B6E]" strokeWidth={1.8} />
          <input
            name="password"
            type={visible ? "text" : "password"}
            required
            autoComplete="current-password"
            minLength={8}
            placeholder="••••••••"
            className={`${authInput} pl-11 pr-11`}
          />
          <button type="button" onClick={() => setVisible((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#E23B6E]" aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
            {visible ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        </span>
      </label>
      <p className="mt-2 text-right">
        <Link href="/mot-de-passe-oublie" className="text-[14px] font-medium text-[#E23B6E]">Mot de passe oublié ?</Link>
      </p>
      <button className={`${authButton} mt-4`} disabled={pending}>
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
      className="mt-6"
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
      {error ? <p className="mb-4 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p> : null}
      {info ? <p className="mb-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{info}</p> : null}
      <label className={authLabel}>
        E-mail
        <span className="relative mt-1.5 block">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#E23B6E]" strokeWidth={1.8} />
          <input name="email" type="email" required placeholder="vous@exemple.fr" className={`${authInput} pl-11`} />
        </span>
      </label>
      <button className={`${authButton} mt-5`}>Envoyer le lien</button>
    </form>
  );
}

export function PasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
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
      <label className={authLabel}>
        Nouveau mot de passe
        <span className="relative mt-1.5 block">
          <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-[#E23B6E]" strokeWidth={1.8} />
          <input name="password" type={visible ? "text" : "password"} minLength={8} required placeholder="8 caractères minimum" className={`${authInput} pl-11 pr-11`} />
          <button type="button" onClick={() => setVisible((value) => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#E23B6E]" aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
            {visible ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
          </button>
        </span>
      </label>
      <button className={authButton}>Mettre à jour</button>
    </form>
  );
}
