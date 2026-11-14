"use client";

import { useState } from "react";
import { vitrineUrl } from "@/lib/storefront";

export function VitrineBar({ slug, embedded = false }: { slug?: string | null; embedded?: boolean }) {
  const clean = slug?.trim() ?? "";
  const [copied, setCopied] = useState(false);
  if (!clean) return null;

  const url = vitrineUrl(clean);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      input.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <>
      <div className={embedded ? "" : "shrink-0 max-w-md px-4 pt-3"}>
        <div className="grid grid-cols-2 gap-2">
          <a
            href={`/${clean}`}
            target="_blank"
            rel="noreferrer"
            className={embedded
              ? "flex h-11 items-center justify-center rounded-2xl bg-[#4a1942] text-sm font-semibold text-white shadow-sm"
              : "flex h-9 items-center justify-center rounded-xl grad text-xs font-semibold text-white"}
          >
            Voir ma vitrine
          </a>
          <button
            type="button"
            onClick={() => void copy()}
            className={embedded
              ? "h-11 rounded-2xl bg-white text-sm font-semibold text-[#4a1942] shadow-sm ring-1 ring-rose-100"
              : "h-9 rounded-xl bg-white text-xs font-semibold text-slate-800 ring-1 ring-slate-200"}
          >
            Copier le lien
          </button>
        </div>
      </div>
      {copied ? (
        <p className="fixed bottom-[4.75rem] left-1/2 z-40 -translate-x-1/2 rounded-full bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-lg" role="status">
          Lien copié
        </p>
      ) : null}
    </>
  );
}
