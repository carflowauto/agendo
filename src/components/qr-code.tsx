"use client";

import { useEffect, useState } from "react";

export function QrCode({ value, size = 220 }: { value: string; size?: number }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    void import("qrcode").then((QR) =>
      QR.toDataURL(value, { margin: 1, width: size, color: { dark: "#312e81", light: "#ffffff" } }).then((url) => {
        if (!cancelled) setSrc(url);
      }),
    );
    return () => {
      cancelled = true;
    };
  }, [value, size]);
  if (!src) return <div className="rounded-xl bg-slate-100" style={{ width: size, height: size }} />;
  return <img src={src} alt="QR code du lien vitrine" width={size} height={size} className="rounded-xl border border-white" />;
}
