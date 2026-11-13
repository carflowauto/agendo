"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/env";
import { eurosToCents } from "@/lib/money";
import { weekdayName } from "@/lib/dates";
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

const DEFAULT_SERVICES = [
  { name: "Pose complète", duration: "120", price: "65" },
  { name: "Remplissage", duration: "75", price: "45" },
  { name: "Dépose", duration: "30", price: "15" },
];

const DEFAULT_HOURS = [
  { isodow: 1, opens: "09:30", closes: "18:30", isClosed: true },
  { isodow: 2, opens: "09:30", closes: "18:30", isClosed: false },
  { isodow: 3, opens: "09:30", closes: "18:30", isClosed: false },
  { isodow: 4, opens: "09:30", closes: "18:30", isClosed: false },
  { isodow: 5, opens: "09:30", closes: "18:30", isClosed: false },
  { isodow: 6, opens: "09:30", closes: "16:00", isClosed: false },
  { isodow: 7, opens: "09:30", closes: "13:00", isClosed: true },
];

export function SignupForm() {
  const [services, setServices] = useState(DEFAULT_SERVICES);
  const [hours, setHours] = useState(DEFAULT_HOURS);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  if (!hasSupabaseEnv()) return <ConfigMissing />;

  return (
    <form
      className="space-y-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setError(null);
        setInfo(null);
        const form = new FormData(event.currentTarget);
        const parsed = services
          .map((row) => ({
            name: row.name.trim(),
            duration_min: Number(row.duration),
            price_cents: eurosToCents(row.price),
          }))
          .filter((row) => row.name);
        if (parsed.length === 0 || parsed.some((row) => !row.duration_min || row.duration_min < 5 || row.price_cents === null)) {
          setError("Chaque prestation doit avoir un nom, une durée (minutes) et un prix.");
          setPending(false);
          return;
        }
        const password = String(form.get("password") ?? "");
        if (password.length < 8) {
          setError("Le mot de passe doit contenir au moins 8 caractères.");
          setPending(false);
          return;
        }
        const supabase = createClient();
        const { data, error: authError } = await supabase.auth.signUp({
          email: String(form.get("email") ?? "").trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            data: {
              full_name: String(form.get("full_name") ?? "").trim(),
              profession: String(form.get("profession") ?? "").trim() || "Prothésiste ongulaire",
              city: String(form.get("city") ?? "").trim(),
              phone: String(form.get("phone") ?? "").trim(),
              services: parsed,
              hours: hours.map((hour) => ({
                isodow: hour.isodow,
                opens: hour.opens,
                closes: hour.closes,
                is_closed: hour.isClosed,
              })),
            },
          },
        });
        if (authError) {
          setError(mapAuth(authError.message));
          setPending(false);
          return;
        }
        if (data.session) {
          window.location.assign("/espace/aujourdhui");
          return;
        }
        setInfo("Compte créé. Ouvrez l’e-mail de confirmation, puis connectez-vous. Pour entrer tout de suite sans e-mail, désactivez « Confirm email » dans Supabase → Authentication → Sign In / Providers → Email.");
        setPending(false);
      }}
    >
      {error ? <p className="rounded-xl bg-rose-50 text-rose-700 text-sm px-4 py-3">{error}</p> : null}
      {info ? <p className="rounded-xl bg-emerald-50 text-emerald-800 text-sm px-4 py-3">{info}</p> : null}
      <div className="grid sm:grid-cols-2 gap-4">
        <label className={labelClass}>Nom<input name="full_name" required className={fieldClass} placeholder="Léa Martin" /></label>
        <label className={labelClass}>Métier<input name="profession" defaultValue="Prothésiste ongulaire" className={fieldClass} /></label>
        <label className={labelClass}>Ville<input name="city" required className={fieldClass} placeholder="Lyon" /></label>
        <label className={labelClass}>Téléphone<input name="phone" required className={fieldClass} placeholder="06 12 34 56 78" /></label>
        <label className={labelClass}>E-mail<input name="email" type="email" required autoComplete="email" className={fieldClass} /></label>
        <label className={labelClass}>Mot de passe<input name="password" type="password" required minLength={8} autoComplete="new-password" className={fieldClass} /></label>
      </div>

      <fieldset>
        <legend className="text-sm font-semibold text-slate-900">Prestations</legend>
        <div className="mt-3 space-y-2">
          {services.map((row, index) => (
            <div key={index} className="grid grid-cols-[1fr_5rem_5rem] gap-2">
              <input aria-label="Nom de la prestation" className={fieldClass + " mt-0"} value={row.name} onChange={(event) => setServices((rows) => rows.map((item, i) => (i === index ? { ...item, name: event.target.value } : item)))} />
              <input aria-label="Durée en minutes" inputMode="numeric" className={fieldClass + " mt-0"} value={row.duration} onChange={(event) => setServices((rows) => rows.map((item, i) => (i === index ? { ...item, duration: event.target.value } : item)))} />
              <input aria-label="Prix en euros" inputMode="decimal" className={fieldClass + " mt-0"} value={row.price} onChange={(event) => setServices((rows) => rows.map((item, i) => (i === index ? { ...item, price: event.target.value } : item)))} />
            </div>
          ))}
        </div>
        <p className="mt-1 text-xs text-slate-500">Nom, durée en minutes, prix en euros.</p>
        <button type="button" className="mt-2 text-sm font-semibold text-brand-700" onClick={() => setServices((rows) => [...rows, { name: "", duration: "60", price: "40" }])}>
          Ajouter une prestation
        </button>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-semibold text-slate-900">Horaires</legend>
        <div className="mt-3 space-y-2">
          {hours.map((hour) => (
            <div key={hour.isodow} className="grid grid-cols-[6rem_1fr_1fr_auto] gap-2 items-center">
              <span className="text-sm text-slate-700">{weekdayName(hour.isodow)}</span>
              <input type="time" disabled={hour.isClosed} value={hour.opens} className={fieldClass + " mt-0"} onChange={(event) => setHours((rows) => rows.map((item) => (item.isodow === hour.isodow ? { ...item, opens: event.target.value } : item)))} />
              <input type="time" disabled={hour.isClosed} value={hour.closes} className={fieldClass + " mt-0"} onChange={(event) => setHours((rows) => rows.map((item) => (item.isodow === hour.isodow ? { ...item, closes: event.target.value } : item)))} />
              <label className="text-xs text-slate-600 flex items-center gap-1">
                <input type="checkbox" checked={hour.isClosed} onChange={(event) => setHours((rows) => rows.map((item) => (item.isodow === hour.isodow ? { ...item, isClosed: event.target.checked } : item)))} />
                Fermé
              </label>
            </div>
          ))}
        </div>
      </fieldset>
      <button className={`${btnPrimary} w-full h-12`} disabled={pending}>
        {pending ? "Création…" : "Créer mon espace"}
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
          redirectTo: `${window.location.origin}/auth/callback?next=/espace/reglages`,
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
