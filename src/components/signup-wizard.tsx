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
import { ConfigMissing } from "@/components/ui";
import { SheensyLogo } from "@/components/sheensy-logo";

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
  "mt-1 w-full rounded-2xl border-0 bg-[#FDE8EF] px-3.5 h-11 text-base text-[#3B1230] outline-none placeholder:text-[#C4A8B4] focus:ring-2 focus:ring-[#E23B6E]/30";
const goClass =
  "h-11 rounded-2xl bg-gradient-to-r from-[#F25A8C] to-[#5A1844] text-sm font-semibold text-white disabled:opacity-40";

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
    <main className="h-dvh overflow-hidden bg-[linear-gradient(180deg,#FDE4EC_0%,#FFF6F8_36%,#FFFFFF_62%)] text-[#3B1230]">
      <div className="mx-auto flex h-full w-full max-w-md flex-col px-5 pt-4 pb-4 sm:max-w-[420px] sm:px-0 sm:py-6">
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex items-center justify-between">
            <SheensyLogo href="/" />
            <Link href="/connexion" className="text-sm font-semibold text-[#E23B6E]">
              Connexion
            </Link>
          </div>

          <div className="mt-4" aria-label={`Étape ${step} sur 3`}>
            <div className="flex items-center justify-between text-xs font-semibold text-[#E23B6E]">
              <span>
                {step}/3
              </span>
              <span>{TITLES[step - 1]}</span>
            </div>
            <div className="mt-1.5 h-1.5 rounded-full bg-[#FDE8EF]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#F25A8C] to-[#5A1844] transition-all duration-500 ease-out" style={{ width: `${(step / 3) * 100}%` }} />
            </div>
          </div>

          <div key={step} data-step={step} className="step-in mt-4 flex min-h-0 flex-1 flex-col">
            <h1 className="text-[1.65rem] font-extrabold leading-tight tracking-tight text-[#3B1230]">{TITLES[step - 1]}</h1>
            <p className="mt-1 text-sm text-[#8E7F87]">
              {step === 1 ? "Le nom qui s’affiche sur votre page." : step === 2 ? "Pour votre lien et vos clientes." : "Vous pourrez compléter le reste ensuite."}
            </p>

            <div className="mt-4 space-y-3">
              {step === 1 ? (
                <>
                  <label className="block text-sm font-semibold text-[#3B1230]">
                    Nom de votre enseigne
                    <input
                      className={inputClass}
                      value={draft.enseigne}
                      autoComplete="organization"
                      placeholder="Atelier Léa"
                      onChange={(event) => patch({ enseigne: event.target.value })}
                    />
                  </label>
                  <label className="block text-sm font-semibold text-[#3B1230]">
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
                  <label className="block text-sm font-semibold text-[#3B1230]">
                    Ville
                    <input
                      className={inputClass}
                      value={draft.city}
                      autoComplete="address-level2"
                      placeholder="Lyon"
                      onChange={(event) => patch({ city: event.target.value })}
                    />
                  </label>
                  <label className="block text-sm font-semibold text-[#3B1230]">
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
                  <label className="block text-sm font-semibold text-[#3B1230]">
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
                  <label className="block text-sm font-semibold text-[#3B1230]">
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
                className="h-11 rounded-2xl px-4 text-sm font-semibold text-[#8E7F87]"
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
                  className={goClass}
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
                  className={goClass}
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
