import { suggestionResponseSchema } from "@/lib/ai/schemas";
import type { LibraryContext } from "@/lib/queries/suggestion-context";

function imslpSearch(query: string): string {
  return `https://imslp.org/wiki/Special:Search?search=${encodeURIComponent(query)}`;
}

/** Parses composer names from lines built in buildLibraryContext (title / composer / …). */
function composersFromLoved(lovedPieces: string[]): string[] {
  const seen = new Set<string>();
  for (const line of lovedPieces) {
    if (line.startsWith("(No highly")) continue;
    const parts = line.split(" / ").map((s) => s.trim());
    if (parts.length >= 2) {
      const c = parts[1];
      if (c && c !== "?" && c.length > 1) seen.add(c);
    }
  }
  return [...seen];
}

/** Parses first instrument from summary like `piano (3), guitar (1)`. */
function topInstrument(summary: string): string | null {
  if (!summary || summary === "unknown") return null;
  const first = summary.split(",")[0]?.trim();
  if (!first) return null;
  return first.replace(/\s*\(\d+\)\s*$/, "").trim() || null;
}

/** Tags from `favoriteVibes` line like `chill (2), cinematic (1)`. */
function topVibeLabels(favoriteVibes: string, limit: number): string[] {
  if (!favoriteVibes || favoriteVibes.includes("not enough")) return [];
  return favoriteVibes
    .split(",")
    .map((s) => s.trim().replace(/\s*\(\d+\)\s*$/, ""))
    .filter(Boolean)
    .slice(0, limit);
}

function formatInstrumentLabel(raw: string): string {
  const s = raw.trim();
  if (!s) return raw;
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

/**
 * No API keys — builds 3–5 discovery links from IMSLP/MuseScore search URLs
 * using composers and instruments already in your library.
 */
export function buildOfflineSuggestions(context: LibraryContext) {
  const composers = composersFromLoved(context.lovedPieces);
  const instrument = topInstrument(context.instrumentsSummary);
  const vibesPool = topVibeLabels(context.favoriteVibes, 5);

  type Row = {
    title: string;
    composer: string | null;
    difficulty_estimate: number;
    why_match: string;
    sheet_music_url: string;
    url_type: "known_sheet_source" | "search_fallback";
    instrument_hint?: string | null;
    vibes?: string[];
  };

  const rows: Row[] = [];

  for (const composer of composers.slice(0, 3)) {
    rows.push({
      title: `Explore works related to ${composer}`,
      composer,
      difficulty_estimate: 3,
      why_match: `You rated pieces involving ${composer} highly. IMSLP has many public-domain scores — use search to find editions to try.`,
      sheet_music_url: imslpSearch(composer),
      url_type: "search_fallback",
      instrument_hint: instrument ? formatInstrumentLabel(instrument) : null,
      vibes: vibesPool.slice(0, 3),
    });
  }

  if (instrument && rows.length < 5) {
    rows.push({
      title: `Browse ${instrument} sheet music (IMSLP search)`,
      composer: null,
      difficulty_estimate: 3,
      why_match: `Your library includes ${instrument}. This search narrows IMSLP results toward that family of repertoire.`,
      sheet_music_url: imslpSearch(`${instrument} solo`),
      url_type: "search_fallback",
      instrument_hint: formatInstrumentLabel(instrument),
      vibes: vibesPool.slice(0, 3),
    });
  }

  // MuseScore community scores (search — not a single edition URL)
  if (rows.length < 5) {
    rows.push({
      title: "Search MuseScore for community scores",
      composer: null,
      difficulty_estimate: 3,
      why_match:
        "MuseScore hosts user-shared arrangements and originals. Good complement when you want something beyond classical PD editions.",
      sheet_music_url: instrument
        ? `https://musescore.com/sheetmusic?text=${encodeURIComponent(instrument)}`
        : "https://musescore.com/sheetmusic",
      url_type: "search_fallback",
      instrument_hint: instrument ? formatInstrumentLabel(instrument) : null,
      vibes: vibesPool.length > 0 ? vibesPool.slice(0, 2) : ["Community"],
    });
  }

  // Pad to at least 3 cards if library is sparse or only placeholders
  const fillers: Row[] = [
    {
      title: "Petrucci Music Library (IMSLP) home",
      composer: null,
      difficulty_estimate: 3,
      why_match:
        "Large free library of scores in the public domain — browse by composer, era, or instrumentation.",
      sheet_music_url: "https://imslp.org/wiki/Main_Page",
      url_type: "known_sheet_source",
      instrument_hint: instrument ? formatInstrumentLabel(instrument) : null,
      vibes: vibesPool.length > 0 ? vibesPool.slice(0, 2) : ["Classical", "Cinematic"],
    },
    {
      title: "IMSLP: instrumental music category",
      composer: null,
      difficulty_estimate: 3,
      why_match: "Jump into IMSLP’s instrumental listings when you want open-ended discovery.",
      sheet_music_url: "https://imslp.org/wiki/Category:For_instruments",
      url_type: "known_sheet_source",
      instrument_hint: instrument ? formatInstrumentLabel(instrument) : "Various",
      vibes: ["Instrumental", ...vibesPool.slice(0, 2)].slice(0, 3),
    },
    {
      title: "Mutopia: free sheet music (downloads)",
      composer: null,
      difficulty_estimate: 3,
      why_match:
        "Mutopia offers free-to-download classical pieces — useful when you want a PDF without hunting editions manually.",
      sheet_music_url: "https://www.mutopiaproject.org/",
      url_type: "known_sheet_source",
      instrument_hint: null,
      vibes: ["Classical", "PDF"],
    },
  ];

  for (const f of fillers) {
    if (rows.length >= 5) break;
    rows.push(f);
  }

  const deduped: Row[] = [];
  const urls = new Set<string>();
  for (const r of rows) {
    if (urls.has(r.sheet_music_url)) continue;
    urls.add(r.sheet_music_url);
    deduped.push(r);
  }

  const suggestions = deduped.slice(0, 5);
  return suggestionResponseSchema.parse({ suggestions });
}
