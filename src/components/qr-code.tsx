"use client";

import { useEffect, useState } from "react";

export function QrCode({ value }: { value: string }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void import("qrcode").then((QR) =>
      QR.toDataURL(value, { margin: 1, width: 220, color: { dark: "#312e81", light: "#ffffff" } }).then((url) => {
        if (!cancelled) setSrc(url);
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [value]);
  if (!src) return <div className="h-[220px] w-[220px] rounded-xl bg-slate-100" />;
  return <img src={src} alt="QR code du lien vitrine" width={220} height={220} className="rounded-xl border border-slate-200" />;
}
