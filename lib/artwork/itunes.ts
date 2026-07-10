import { containsNormalized, normalizeArtworkText, tokenOverlap } from "@/lib/artwork/normalize";

/** Resolve higher-res artwork URL from iTunes thumb URLs. */
export function upscaleItunesArtwork(url: string): string {
  return url
    .replace(/\/\d+x\d+bb\.jpg/i, "/600x600bb.jpg")
    .replace(/\/\d+x\d+bb\.png/i, "/600x600bb.png");
}

export type ItunesSearchHit = {
  artworkUrl100?: string;
  trackName?: string;
  artistName?: string;
  collectionName?: string;
  collectionArtistName?: string;
  wrapperType?: string;
  kind?: string;
};

const LOW_QUALITY_TERMS = [
  "karaoke",
  "tribute",
  "cover version",
  "white noise",
  "rain sounds",
  "study music",
  "sleep",
  "lullaby",
  "8-bit",
  "8 bit",
  "midi",
  "ringtone",
  "wellness",
  "meditation",
  "baby",
  "lofi beats",
  "lo-fi",
];

function combinedText(hit: ItunesSearchHit): string {
  return [hit.trackName, hit.artistName, hit.collectionName, hit.collectionArtistName]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function scoreItunesHit(hit: ItunesSearchHit, title: string, composer: string | null): number {
  const track = hit.trackName ?? hit.collectionName ?? "";
  const artist = hit.artistName ?? hit.collectionArtistName ?? "";
  const album = hit.collectionName ?? "";
  const blob = combinedText(hit);

  if (LOW_QUALITY_TERMS.some((term) => blob.includes(term))) return -10;

  let score = 0;

  const normalizedTitle = normalizeArtworkText(title);
  const normalizedTrack = normalizeArtworkText(track);

  if (normalizedTitle && normalizedTrack === normalizedTitle) score += 8;
  else if (normalizedTitle && containsNormalized(track, title)) score += 5;
  else if (normalizedTitle && tokenOverlap(title, track) >= 2) score += 3;
  else if (normalizedTitle && tokenOverlap(title, track) >= 1) score += 1;

  if (normalizedTitle && containsNormalized(album, title)) score += 4;
  if (normalizedTitle && tokenOverlap(title, album) >= 2) score += 2;

  const c = composer?.trim();
  if (c) {
    if (containsNormalized(artist, c)) score += 6;
    else if (tokenOverlap(c, artist) >= 2) score += 4;
    else if (containsNormalized(album, c)) score += 5;
    else if (tokenOverlap(c, album) >= 2) score += 3;
    else if (containsNormalized(hit.collectionArtistName ?? "", c)) score += 4;

    // Classical albums often credit the composer in the album title.
    if (containsNormalized(album, c) && containsNormalized(album, title)) score += 3;
  }

  if (hit.wrapperType === "collection" || hit.kind === "album") score += 1;

  return score;
}

async function searchItunes(term: string, entity: "song" | "album"): Promise<ItunesSearchHit[]> {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=${entity}&limit=12&media=music`;

  try {
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
    });

    if (!res.ok) return [];

    const data = (await res.json()) as { results?: ItunesSearchHit[] };
    return (data.results ?? []).filter((result) => result.artworkUrl100);
  } catch {
    return [];
  }
}

function pickBestHit(hits: ItunesSearchHit[], title: string, composer: string | null): ItunesSearchHit | null {
  if (hits.length === 0) return null;

  const ranked = [...hits].sort(
    (a, b) => scoreItunesHit(b, title, composer) - scoreItunesHit(a, title, composer)
  );

  const best = ranked[0];
  if (!best) return null;

  const bestScore = scoreItunesHit(best, title, composer);
  if (bestScore < 4) return null;

  return best;
}

function buildSearchTerms(title: string, composer: string | null, extraTerms: string[] = []): string[] {
  const t = title.trim();
  const c = composer?.trim() ?? "";
  const terms = new Set<string>();

  for (const extra of extraTerms) {
    const trimmed = extra.trim();
    if (trimmed) terms.add(trimmed);
  }

  if (t && c) {
    terms.add(`${c} ${t}`);
    terms.add(`${t} ${c}`);
    terms.add(`${t} - ${c}`);
  }
  if (t) terms.add(t);
  if (c && t) terms.add(`${c}: ${t}`);

  return [...terms];
}

export async function fetchArtworkUrlFromItunes(
  title: string,
  composer: string | null,
  extraTerms: string[] = []
): Promise<string | null> {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) return null;

  const terms = buildSearchTerms(trimmedTitle, composer, extraTerms);
  let bestHit: ItunesSearchHit | null = null;
  let bestScore = -Infinity;

  for (const term of terms) {
    for (const entity of ["album", "song"] as const) {
      const hits = await searchItunes(term, entity);
      for (const hit of hits) {
        const score = scoreItunesHit(hit, trimmedTitle, composer);
        if (score > bestScore) {
          bestScore = score;
          bestHit = hit;
        }
      }
    }
  }

  const chosen = bestHit && bestScore >= 4 ? bestHit : pickBestHit(bestHit ? [bestHit] : [], trimmedTitle, composer);
  const thumb = chosen?.artworkUrl100;
  if (!thumb) return null;

  return upscaleItunesArtwork(thumb);
}
