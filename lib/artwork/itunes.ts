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
};

export async function fetchArtworkUrlFromItunes(title: string, composer: string | null): Promise<string | null> {
  const term = [title, composer].filter((s) => s?.trim()).join(" ").trim();
  if (!term) return null;

  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=song&limit=10&media=music`;

  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 * 60 * 24 },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as { results?: ItunesSearchHit[] };
  const results = (data.results ?? []).filter((r) => r.artworkUrl100);
  if (results.length === 0) return null;

  const t = title.trim().toLowerCase();
  const c = (composer ?? "").trim().toLowerCase();

  const ranked = [...results].sort((a, b) => {
    const score = (r: ItunesSearchHit) => {
      let s = 0;
      const tn = r.trackName?.toLowerCase() ?? "";
      const an = r.artistName?.toLowerCase() ?? "";
      if (t && tn === t) s += 4;
      else if (t && tn.includes(t)) s += 2;
      if (c && an.includes(c)) s += 3;
      return s;
    };
    return score(b) - score(a);
  });

  const thumb = ranked[0]?.artworkUrl100;
  if (!thumb) return null;

  return upscaleItunesArtwork(thumb);
}
