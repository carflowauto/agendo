"use client";

import { useState } from "react";
import { btnSecondary } from "@/components/ui";

export function CopyButton({ value, label = "Copier" }: { value: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={btnSecondary}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          window.setTimeout(() => setDone(false), 2000);
        } catch {
          setDone(false);
        }
      }}
    >
      {done ? "Copié" : label}
    </button>
  );
}
