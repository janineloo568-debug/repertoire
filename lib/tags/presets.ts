export const PRESET_TAG_SLUGS = [
  "airport-ambiance",
  "active-practice",
  "campfire",
  "show-off-piece",
  "dark-academia",
  "background-music",
  "rainy-day",
  "wedding",
  "exam-piece",
  "comfort-piece",
] as const;

const LABELS: Record<(typeof PRESET_TAG_SLUGS)[number], string> = {
  "airport-ambiance": "Airport ambiance",
  "active-practice": "Active practice",
  campfire: "Campfire",
  "show-off-piece": "Show-off piece",
  "dark-academia": "Dark academia",
  "background-music": "Background music",
  "rainy-day": "Rainy day",
  wedding: "Wedding",
  "exam-piece": "Exam piece",
  "comfort-piece": "Comfort piece",
};

export function presetDisplayName(slug: string): string {
  return LABELS[slug as keyof typeof LABELS] ?? slug;
}
