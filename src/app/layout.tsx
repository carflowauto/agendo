import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: { default: "Agendo", template: "%s · Agendo" },
  description: "Prise de rendez-vous en ligne pour prothésistes ongulaires et indépendantes.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className={`${inter.variable} font-sans bg-slate-50 text-slate-800`}>{children}</body>
    </html>
  );
}
