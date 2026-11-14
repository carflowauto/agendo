import Link from "next/link";
import { MapPin, Paintbrush, Scissors, Search, Syringe, User, UserRound } from "lucide-react";
import { SheensyLogo } from "@/components/sheensy-logo";
import { initials } from "@/lib/phone";
import { SALON_CATEGORIES, type PublicSalon } from "@/lib/salons";

function NailChip({ className }: { className?: string; strokeWidth?: number }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="7" y="4" width="6" height="10" rx="3" />
      <path d="M10 14v6" strokeLinecap="round" />
    </svg>
  );
}

const CHIP_ICONS = {
  ongles: NailChip,
  coiffure: Scissors,
  maquillage: Paintbrush,
  esthetique: UserRound,
  injections: Syringe,
} as const;

export function MarketHeader() {
  return (
    <header className="mx-auto flex h-16 w-full max-w-5xl items-center px-4 sm:px-5">
      <SheensyLogo href="/" />
      <div className="ml-auto flex items-center gap-3">
        <Link href="/pro" className="text-[14px] font-medium text-[#4A1238]">Vous êtes pro ?</Link>
        <Link href="/connexion" aria-label="Connexion" className="flex h-9 w-9 items-center justify-center rounded-full border border-[#E4D5DA] text-[#4A1238]">
          <User className="h-[18px] w-[18px]" strokeWidth={1.7} />
        </Link>
      </div>
    </header>
  );
}

export function SalonSearch({ query = "", city = "" }: { query?: string; city?: string }) {
  return (
    <form action="/recherche" className="rounded-[22px] bg-white p-3 shadow-[0_12px_32px_rgba(74,18,56,0.08)]">
      <label className="flex items-center gap-2 border-b border-[#F3E6EA] px-2 py-2.5">
        <Search className="h-[18px] w-[18px] shrink-0 text-[#8E7F87]" strokeWidth={1.7} />
        <input name="q" defaultValue={query} placeholder="Prestation ou salon" className="w-full bg-transparent text-[15px] text-[#4A1238] outline-none placeholder:text-[#B7A8B0]" />
      </label>
      <label className="flex items-center gap-2 px-2 py-2.5">
        <MapPin className="h-[18px] w-[18px] shrink-0 text-[#8E7F87]" strokeWidth={1.7} />
        <input name="ville" defaultValue={city} placeholder="Ville ou code postal" className="w-full bg-transparent text-[15px] text-[#4A1238] outline-none placeholder:text-[#B7A8B0]" />
      </label>
      <button className="mt-1 h-11 w-full rounded-xl bg-[#E7A0B4] text-[15px] font-semibold text-white">Rechercher</button>
    </form>
  );
}

export function CategoryChips({ active = "" }: { active?: string }) {
  return (
    <div className="flex gap-0.5">
      {SALON_CATEGORIES.map((item) => {
        const Icon = CHIP_ICONS[item.id];
        const on = active === item.id;
        return (
          <Link key={item.id} href={`/recherche?categorie=${item.id}`} className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border bg-white px-1 py-1 text-[11px] font-medium tracking-tight text-[#4A1238] ${on ? "border-[#E23B6E]" : "border-[#E7DDE1]"}`}>
            <Icon className="h-3 w-3" strokeWidth={1.6} />
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}

export function SalonCards({ salons, empty }: { salons: PublicSalon[]; empty: string }) {
  if (salons.length === 0) {
    return <p className="rounded-2xl bg-white px-4 py-6 text-center text-sm text-[#8E7F87]">{empty}</p>;
  }
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
      {salons.map((salon) => (
        <article key={salon.slug} className="overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_rgba(74,18,56,0.06)]">
          <div className="relative aspect-[4/3] bg-gradient-to-br from-[#F6D5E1] to-[#E7A0B4]">
            {salon.cover_url ? (
              <img src={salon.cover_url} alt="" className="absolute inset-0 h-full w-full object-cover" />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-white">{initials(salon.full_name)}</span>
            )}
          </div>
          <div className="px-3 py-2.5">
            <p className="truncate font-display text-[18px] leading-tight text-[#4A1238]">{salon.full_name}</p>
            <p className="mt-0.5 truncate text-[13px] text-[#8E7F87]">{salon.city}</p>
            <Link href={`/${salon.slug}`} className="mt-1.5 inline-block text-[14px] font-semibold text-[#E23B6E]">Réserver</Link>
          </div>
        </article>
      ))}
    </div>
  );
}
