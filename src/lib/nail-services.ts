export type NailSuggestion = {
  name: string;
  durationMin: number;
  priceCents: number;
};

export const NAIL_SUGGESTIONS: NailSuggestion[] = [
  { name: "Pose gel", durationMin: 90, priceCents: 4500 },
  { name: "Remplissage gel", durationMin: 75, priceCents: 3500 },
  { name: "Semi-permanent mains", durationMin: 45, priceCents: 2500 },
  { name: "Semi-permanent pieds", durationMin: 45, priceCents: 2500 },
  { name: "Pose capsules / chablon", durationMin: 105, priceCents: 5500 },
  { name: "Nail art", durationMin: 15, priceCents: 500 },
  { name: "French", durationMin: 30, priceCents: 1000 },
  { name: "Dépose", durationMin: 30, priceCents: 1500 },
  { name: "Renforcement ongle naturel / Rubber base", durationMin: 60, priceCents: 3500 },
  { name: "Manucure russe", durationMin: 60, priceCents: 3500 },
  { name: "Beauté des pieds", durationMin: 60, priceCents: 3500 },
];

export function normalizeServiceName(name: string) {
  return name
    .trim()
    .toLocaleLowerCase("fr")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function pendingSuggestions(existingNames: string[]) {
  const added = new Set(existingNames.map(normalizeServiceName));
  return NAIL_SUGGESTIONS.filter((item) => !added.has(normalizeServiceName(item.name)));
}
