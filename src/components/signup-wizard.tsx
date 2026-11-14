"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hasSupabaseEnv } from "@/lib/env";
import { siteUrl } from "@/lib/site";
import {
  DEFAULT_PROFESSION,
  PROFESSIONS,
  stepIsValid,
  type SignupDraft,
} from "@/lib/signup";
import { ConfigMissing, Logo } from "@/components/ui";

const TITLES = ["Votre enseigne", "Où vous trouver", "Votre accès"] as const;

function mapAuth(message: string) {
  const lower = message.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already been registered")) {
    return "Un compte existe déjà avec cet e-mail.";
  }
  if (lower.includes("password")) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (lower.includes("email")) return "Adresse e-mail invalide.";
  if (lower.includes("rate")) return "Trop de tentatives. Réessayez dans quelques minutes.";
  return message;
}

const inputClass =
  "mt-1 w-full rounded-2xl border border-white/80 bg-white px-3.5 h-11 text-base text-slate-900 outline-none shadow-sm focus:ring-2 focus:ring-brand-400";

export function SignupWizard() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [draft, setDraft] = useState<SignupDraft>({
    enseigne: "",
    profession: DEFAULT_PROFESSION,
    city: "",
    phone: "",
    email: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const valid = stepIsValid(step, draft);

  function patch(partial: Partial<SignupDraft>) {
    setDraft((current) => ({ ...current, ...partial }));
    setError(null);
  }

  async function createAccount() {
    if (!stepIsValid(3, draft)) return;
    setPending(true);
    setError(null);
    const supabase = createClient();
    const { data, error: authError } = await supabase.auth.signUp({
      email: draft.email.trim(),
      password: draft.password,
      options: {
            emailRedirectTo: `${siteUrl()}/auth/callback`,
        data: {
          full_name: draft.enseigne.trim(),
          profession: draft.profession,
          city: draft.city.trim(),
          phone: draft.phone.trim(),
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
    setInfo("Compte créé. Ouvrez l’e-mail de confirmation, puis connectez-vous.");
    setPending(false);
  }

  if (!hasSupabaseEnv()) {
    return (
      <div className="h-dvh overflow-hidden flex items-center justify-center p-6">
        <ConfigMissing />
      </div>
    );
  }

  return (
    <main className="h-dvh overflow-hidden bg-[radial-gradient(circle_at_top,_#fde7f3_0%,_#eef2ff_42%,_#f8fafc_100%)] text-slate-800">
      <div className="mx-auto flex h-full w-full max-w-md flex-col px-5 pt-4 pb-4 sm:max-w-[420px] sm:px-0 sm:py-6">
        <div className="flex min-h-0 flex-1 flex-col rounded-[28px] sm:border sm:border-white/70 sm:bg-white/75 sm:px-6 sm:py-5 sm:shadow-xl sm:shadow-brand-900/10 sm:backdrop-blur">
          <div className="flex items-center justify-between">
            <Logo href="/" compact />
            <Link href="/connexion" className="text-sm font-semibold text-brand-700">
              Connexion
            </Link>
          </div>

          <div className="mt-4" aria-label={`Étape ${step} sur 3`}>
            <div className="flex items-center justify-between text-xs font-semibold text-brand-700">
              <span>
                {step}/3
              </span>
              <span>{TITLES[step - 1]}</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-white/80">
              <div className="h-full rounded-full grad transition-all duration-500 ease-out" style={{ width: `${(step / 3) * 100}%` }} />
            </div>
          </div>

          <div key={step} data-step={step} className="step-in mt-4 flex min-h-0 flex-1 flex-col">
            <h1 className="text-[1.65rem] font-extrabold leading-tight tracking-tight text-slate-900">{TITLES[step - 1]}</h1>
            <p className="mt-1 text-sm text-slate-500">
              {step === 1 ? "Le nom qui s’affiche sur votre page." : step === 2 ? "Pour votre lien et vos clientes." : "Vous pourrez compléter le reste ensuite."}
            </p>

            <div className="mt-4 space-y-3">
              {step === 1 ? (
                <>
                  <label className="block text-sm font-medium text-slate-700">
                    Nom de votre enseigne
                    <input
                      className={inputClass}
                      value={draft.enseigne}
                      autoComplete="organization"
                      placeholder="Atelier Léa"
                      onChange={(event) => patch({ enseigne: event.target.value })}
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Métier
                    <select className={inputClass} value={draft.profession} onChange={(event) => patch({ profession: event.target.value })}>
                      {PROFESSIONS.map((profession) => (
                        <option key={profession}>{profession}</option>
                      ))}
                    </select>
                  </label>
                </>
              ) : null}
              {step === 2 ? (
                <>
                  <label className="block text-sm font-medium text-slate-700">
                    Ville
                    <input
                      className={inputClass}
                      value={draft.city}
                      autoComplete="address-level2"
                      placeholder="Lyon"
                      onChange={(event) => patch({ city: event.target.value })}
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Numéro de téléphone
                    <input
                      className={inputClass}
                      value={draft.phone}
                      inputMode="tel"
                      autoComplete="tel"
                      placeholder="06 12 34 56 78"
                      onChange={(event) => patch({ phone: event.target.value })}
                    />
                  </label>
                </>
              ) : null}
              {step === 3 ? (
                <>
                  <label className="block text-sm font-medium text-slate-700">
                    E-mail
                    <input
                      className={inputClass}
                      type="email"
                      value={draft.email}
                      autoComplete="email"
                      placeholder="lea@email.fr"
                      onChange={(event) => patch({ email: event.target.value })}
                    />
                  </label>
                  <label className="block text-sm font-medium text-slate-700">
                    Mot de passe
                    <input
                      className={inputClass}
                      type="password"
                      value={draft.password}
                      autoComplete="new-password"
                      placeholder="8 caractères minimum"
                      onChange={(event) => patch({ password: event.target.value })}
                    />
                  </label>
                </>
              ) : null}
            </div>

            {error ? <p className="mt-3 text-sm text-rose-700">{error}</p> : null}
            {info ? <p className="mt-3 text-sm text-emerald-800">{info}</p> : null}

            <div className="mt-auto grid grid-cols-[auto_1fr] gap-2 pt-4">
              <button
                type="button"
                className="h-11 rounded-2xl px-4 text-sm font-semibold text-slate-600 hover:bg-white/70"
                onClick={() => {
                  setError(null);
                  setInfo(null);
                  if (step === 1) window.location.assign("/");
                  else setStep((current) => (current === 3 ? 2 : 1));
                }}
              >
                Retour
              </button>
              {step < 3 ? (
                <button
                  type="button"
                  disabled={!valid}
                  className="h-11 rounded-2xl grad text-sm font-semibold text-white shadow-md shadow-brand-500/20 disabled:opacity-40"
                  onClick={() => {
                    if (!valid) return;
                    setStep((current) => (current === 1 ? 2 : 3));
                  }}
                >
                  Continuer
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!valid || pending}
                  className="h-11 rounded-2xl grad text-sm font-semibold text-white shadow-md shadow-brand-500/20 disabled:opacity-40"
                  onClick={() => void createAccount()}
                >
                  {pending ? "Création…" : "Créer mon espace"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
