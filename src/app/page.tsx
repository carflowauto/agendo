import { CategoryChips, MarketHeader, SalonCards, SalonSearch } from "@/components/market";
import { searchSalons } from "@/lib/salons";

export const metadata = {
  title: "Sheensy",
  description: "Les meilleurs salons près de chez vous, en quelques clics.",
};

export default async function HomePage() {
  const salons = await searchSalons({ limit: 8 });
  return (
    <div className="min-h-screen bg-[#FBF4F6] text-[#4A1238]">
      <MarketHeader />
      <div className="relative mx-auto w-full max-w-5xl px-4 pb-16 sm:px-5">
        <div className="pointer-events-none absolute -left-8 top-0 h-48 w-56 rounded-full bg-[#F8D5E2]/80 blur-3xl" />
        <h1 className="relative font-display text-[42px] leading-[1.05] text-[#4A1942] sm:text-6xl">
          Réservez votre<br />moment beauté
        </h1>
        <p className="relative mt-3 max-w-[16.5rem] text-[16px] leading-snug text-[#8E7F87] sm:max-w-md">
          Les meilleurs salons près de chez vous, en quelques clics.
        </p>
        <div className="relative mt-6 max-w-xl">
          <SalonSearch />
        </div>
        <div className="relative mt-4">
          <CategoryChips />
        </div>
        <h2 className="relative mt-8 font-display text-[28px] text-[#4A1942]">Près de chez vous</h2>
        <div className="relative mt-3">
          <SalonCards salons={salons} empty="Les salons apparaîtront ici dès qu’ils auront ouvert leur page." />
        </div>
      </div>
    </div>
  );
}
