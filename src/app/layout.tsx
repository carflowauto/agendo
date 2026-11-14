import type { Metadata } from "next";
import { DM_Serif_Display, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { siteUrl } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const display = DM_Serif_Display({ subsets: ["latin"], weight: "400", variable: "--font-display" });
const url = siteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(url),
  title: { default: "Sheensy", template: "%s · Sheensy" },
  description: "Prise de rendez-vous en ligne pour les pros de la beauté.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Sheensy",
    description: "Prise de rendez-vous en ligne pour les pros de la beauté.",
    siteName: "Sheensy",
    url,
    locale: "fr_FR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} ${display.variable} font-sans bg-slate-50 text-slate-800`}>{children}</body>
    </html>
  );
}
