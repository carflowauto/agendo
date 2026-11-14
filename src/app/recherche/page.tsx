import { CategoryChips, MarketHeader, SalonCards, SalonSearch } from "@/components/market";
import { isSalonCategory, SALON_CATEGORIES, searchSalons } from "@/lib/salons";

export const metadata = { title: "Recherche" };

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; ville?: string; categorie?: string }> }) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const city = params.ville?.trim() ?? "";
  const category = params.categorie && isSalonCategory(params.categorie) ? params.categorie : "";
  const salons = await searchSalons({ query, city, category, limit: 24 });
  const label = SALON_CATEGORIES.find((item) => item.id === category)?.label;
  const filtered = Boolean(query || city || category);

  return (
    <div className="min-h-screen bg-[#FBF4F6] text-[#4A1238]">
      <MarketHeader />
      <div className="mx-auto w-full max-w-5xl px-5 pb-16">
        <h1 className="font-display text-[32px] leading-tight text-[#4A1942]">{label ? label : "Recherche"}</h1>
        <div className="mt-4 max-w-xl">
          <SalonSearch query={query} city={city} />
        </div>
        <div className="mt-4">
          <CategoryChips active={category} />
        </div>
        <div className="mt-6">
          <SalonCards
            salons={salons}
            empty={filtered ? "Aucun salon ne correspond à cette recherche." : "Les salons apparaîtront ici dès qu’ils auront ouvert leur page."}
          />
        </div>
      </div>
    </div>
  );
}
