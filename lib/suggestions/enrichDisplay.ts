import type { InferSelectModel } from "drizzle-orm";
import type { suggestions } from "@/lib/db/schema";
import type { LibraryContext } from "@/lib/queries/suggestion-context";

export type SuggestionRow = InferSelectModel<typeof suggestions>;

function formatInstrumentLabel(raw: string): string {
  const s = raw.trim();
  if (!s) return raw;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/** First instrument from `piano (3), guitar (1)` summary. */
function topInstrumentFromSummary(summary: string): string | null {
  if (!summary || summary === "unknown") return null;
  const first = summary.split(",")[0]?.trim();
  if (!first) return null;
  return first.replace(/\s*\(\d+\)\s*$/, "").trim() || null;
}

/** Labels from favorite vibes line like `chill (2), cinematic (1)`. */
function vibeLabelsFromLine(favoriteVibes: string, limit: number): string[] {
  if (!favoriteVibes || favoriteVibes.includes("not enough")) return [];
  return favoriteVibes
    .split(",")
    .map((s) => s.trim().replace(/\s*\(\d+\)\s*$/, ""))
    .filter(Boolean)
    .slice(0, limit);
}

/**
 * Ensures every suggestion row has instrument + vibe badges for the UI, using stored
 * values when present and library-wide fallbacks otherwise (covers legacy rows).
 */
export function enrichSuggestionForDisplay(row: SuggestionRow, ctx: LibraryContext): SuggestionRow {
  const storedInstrument = row.instrumentHint?.trim();
  const storedVibes = row.vibeHints?.filter(Boolean) ?? [];

  let instrumentHint = storedInstrument || null;
  if (!instrumentHint) {
    const raw = topInstrumentFromSummary(ctx.instrumentsSummary);
    instrumentHint = raw ? formatInstrumentLabel(raw) : "Mixed";
  }

  let vibeHints = [...storedVibes];
  if (vibeHints.length === 0) {
    vibeHints = vibeLabelsFromLine(ctx.favoriteVibes, 3);
    if (vibeHints.length === 0) {
      vibeHints = ["Cinematic"];
    }
  }

  return {
    ...row,
    instrumentHint,
    vibeHints,
  };
}
