"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CalendarDays,
  Clock,
  Euro,
  Eye,
  Flower2,
  Hand,
  Link2,
  MapPin,
  MoreHorizontal,
  Paintbrush,
  Palette,
  Phone,
  Plus,
  Scissors,
  Sparkles,
  Store,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Flash } from "@/components/ui";
import { vitrineUrl } from "@/lib/storefront";
import { cancelAppointment } from "@/server/actions";

const rose = "#D9577A";
const plum = "#4A1238";

export type TodayNext = {
  time: string;
  line: string;
  phone: string | null;
  maps: string | null;
  sms: string | null;
};

export type TodayRow =
  | { kind: "rdv"; id: string; time: string; name: string; service: string; badge: string; highlighted: boolean; blocked: boolean }
  | { kind: "gap"; id: string; time: string };

export function TodayDashboard({
  dateLabel,
  slug,
  count,
  revenue,
  trend,
  free,
  next,
  rows,
  empty,
  needsSetup,
  ok,
  erreur,
  agendaHref,
}: {
  dateLabel: string;
  slug: string;
  count: number;
  revenue: string;
  trend: "up" | "down" | "flat";
  free: string;
  next: TodayNext | null;
  rows: TodayRow[];
  empty: boolean;
  needsSetup: boolean;
  ok?: string;
  erreur?: string;
  agendaHref: string;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white" style={{ color: plum }}>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-3">
        <p className="text-[14px] text-[#B7A8B0]">{dateLabel}</p>

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat icon={CalendarDays} value={String(count)} label="RDV" hint="Aujourd'hui" />
          <Stat icon={Euro} value={revenue} label="Chiffre du jour" hint="vs hier" trend={trend} />
          <Stat icon={Clock} value={free} label="créneaux libres" hint="Aujourd'hui" />
        </div>

        {ok || erreur ? <div className="mt-3"><Flash ok={ok} erreur={erreur} /></div> : null}
        {needsSetup ? (
          <Link href="/espace/reglages/prestations" className="mt-3 flex items-center justify-between rounded-2xl bg-[#FDECEF] px-3 py-2 text-[13px] font-medium">
            Ajoute tes prestations et horaires
            <span aria-hidden="true">→</span>
          </Link>
        ) : null}

        {next ? <NextCard item={next} /> : null}

        <section className="mt-4">
          <h2 className="text-[16px] font-bold">Programme du jour</h2>
          {empty ? (
            <p className="mt-3 rounded-2xl bg-[#FDECEF] px-4 py-5 text-center text-sm font-semibold">Aucun rendez-vous aujourd’hui</p>
          ) : (
            <div className="relative mt-2">
              <div className="absolute bottom-6 left-[2.85rem] top-5 w-px bg-[#F3D5DC]" />
              <ol className="space-y-2">
                {rows.map((row) => row.kind === "gap" ? <GapRow key={row.id} time={row.time} /> : <AppointmentRow key={row.id} row={row} />)}
              </ol>
            </div>
          )}
        </section>

        <div className="mt-4 flex items-center gap-2">
          {slug ? (
            <a href={`/${slug}`} target="_blank" rel="noreferrer" className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border border-[#F0C6D2] bg-white px-2 text-[13px] font-semibold" style={{ color: rose }}>
              <Store className="h-4 w-4 shrink-0" />
              Voir ma vitrine
            </a>
          ) : null}
          {slug ? <CopyLink slug={slug} /> : null}
          <Link href={agendaHref} aria-label="Ajouter un rendez-vous" className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E56B8C] to-[#4A1238] text-white shadow-[0_8px_18px_rgba(74,18,56,0.28)]">
            <Plus className="h-7 w-7" strokeWidth={2.4} />
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, value, label, hint, trend }: { icon: LucideIcon; value: string; label: string; hint: string; trend?: "up" | "down" | "flat" }) {
  const Trend = trend === "down" ? TrendingDown : TrendingUp;
  return (
    <article className="rounded-[18px] bg-white px-2.5 py-2.5 shadow-[0_8px_20px_rgba(74,18,56,0.06)]">
      <div className="flex items-center gap-1">
        <Icon className="h-[18px] w-[18px] shrink-0" style={{ color: rose }} strokeWidth={2} />
        <p className="truncate text-[20px] font-extrabold leading-none">{value}</p>
      </div>
      <p className="mt-1.5 truncate text-[11px] text-[#8E7F87]">{label}</p>
      <p className="mt-1 flex items-center gap-1 text-[10px] text-[#B7A8B0]">
        {trend ? <Trend className="h-3 w-3" style={{ color: rose }} strokeWidth={2.4} /> : <span className="h-1.5 w-1.5 rounded-full" style={{ background: rose }} />}
        {hint}
      </p>
    </article>
  );
}

function NextCard({ item }: { item: TodayNext }) {
  return (
    <section className="mt-3 rounded-[22px] bg-[#FDECEF] px-3.5 py-3">
      <p className="flex items-center gap-1.5 text-[14px] font-semibold">
        <CalendarDays className="h-4 w-4" style={{ color: rose }} />
        Prochain rendez-vous
      </p>
      <div className="mt-2.5 flex gap-2.5">
        <div className="flex w-3 flex-col items-center pt-1">
          <span className="h-3 w-3 rounded-full border-2 bg-white" style={{ borderColor: rose }} />
          <span className="mt-1 w-px flex-1 bg-[#F3C6D2]" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-semibold leading-snug">{item.line}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {item.phone ? (
              <a href={`tel:${item.phone.replace(/\s/g, "")}`} className="inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold text-white" style={{ background: rose }}>
                <Phone className="h-3.5 w-3.5" />
                Appeler
              </a>
            ) : null}
            {item.maps ? (
              <a href={item.maps} target="_blank" rel="noreferrer" className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#F0C6D2] bg-white px-3.5 text-[13px] font-semibold" style={{ color: rose }}>
                <MapPin className="h-3.5 w-3.5" />
                Itinéraire
              </a>
            ) : item.sms ? (
              <a href={item.sms} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-[#F0C6D2] bg-white px-3.5 text-[13px] font-semibold" style={{ color: rose }}>
                SMS
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function AppointmentRow({ row }: { row: Extract<TodayRow, { kind: "rdv" }> }) {
  const Icon = serviceIcon(row.service);
  return (
    <li className="grid grid-cols-[2.5rem_0.75rem_minmax(0,1fr)] items-center">
      <p className="text-[12px] font-medium text-[#B7A8B0]">{row.time}</p>
      <span className={`z-10 mx-auto h-2.5 w-2.5 rounded-full ${row.highlighted ? "" : "bg-white ring-2 ring-[#E7D0D8]"}`} style={row.highlighted ? { background: rose } : undefined} />
      <article className={`flex min-w-0 items-center gap-2 rounded-[16px] py-2 pl-2 pr-1 ${row.highlighted ? "bg-[#FDECEF]" : "bg-white shadow-[0_4px_14px_rgba(74,18,56,0.05)]"}`}>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FDE7EE]" style={{ color: rose }}>
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-bold leading-tight">{row.name}</p>
          <p className="truncate text-[12px] text-[#A08B94]">{row.service}</p>
        </div>
        <span className="shrink-0 text-[12px] font-semibold" style={{ color: rose }}>{row.badge}</span>
        <RowMenu id={row.id} blocked={row.blocked} />
      </article>
    </li>
  );
}

function GapRow({ time }: { time: string }) {
  return (
    <li className="grid grid-cols-[2.5rem_0.75rem_minmax(0,1fr)] items-center">
      <p className="text-[12px] font-medium text-[#B7A8B0]">{time}</p>
      <span className="z-10 mx-auto h-2.5 w-2.5 rounded-full bg-white ring-2 ring-[#E7D0D8]" />
      <article className="flex items-center gap-2 rounded-[16px] border border-dashed border-[#E7D0D8] bg-white px-2.5 py-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F7F1F3] text-[#C4B4BC]">
          <Clock className="h-4 w-4" />
        </span>
        <div>
          <p className="text-[14px] font-bold leading-tight">Libre</p>
          <p className="text-[12px] text-[#A08B94]">Créneau disponible</p>
        </div>
      </article>
    </li>
  );
}

function RowMenu({ id, blocked }: { id: string; blocked: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" aria-label="Actions" onClick={() => setOpen((value) => !value)} className="flex h-7 w-7 items-center justify-center text-[#C4B4BC]">
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open ? (
        <form action={cancelAppointment} className="absolute right-0 top-8 z-20 rounded-xl bg-white p-1 shadow-lg ring-1 ring-[#F3D5DC]">
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="back" value="/espace/aujourdhui" />
          <button className="whitespace-nowrap rounded-lg px-3 py-2 text-left text-sm font-semibold" style={{ color: rose }}>{blocked ? "Retirer" : "Annuler"}</button>
        </form>
      ) : null}
    </div>
  );
}

function CopyLink({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const url = vitrineUrl(slug);
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
    window.setTimeout(() => setCopied(false), 1600);
  }
  return (
    <>
      <button type="button" onClick={() => void copy()} className="inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-1.5 rounded-full border border-[#F0C6D2] bg-white px-2 text-[13px] font-semibold" style={{ color: rose }}>
        <Link2 className="h-4 w-4 shrink-0" />
        {copied ? "Lien copié" : "Copier le lien"}
      </button>
      {copied ? <p className="sr-only" role="status">Lien copié</p> : null}
    </>
  );
}

function serviceIcon(name: string): LucideIcon {
  const value = name.toLowerCase();
  if (/coiff|coupe|brush|color/.test(value)) return Scissors;
  if (/maquill/.test(value)) return Palette;
  if (/cil|regard/.test(value)) return Eye;
  if (/rempl/.test(value)) return Sparkles;
  if (/soin|visage|massage|esth/.test(value)) return Flower2;
  if (/manuc/.test(value)) return Paintbrush;
  if (/gel|pose|ongle|nail|semi/.test(value)) return Hand;
  return Sparkles;
}
