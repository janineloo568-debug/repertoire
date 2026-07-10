import { fetchArtworkUrlFromItunes } from "@/lib/artwork/itunes";
import { fetchArtworkUrlFromMusicBrainz } from "@/lib/artwork/musicbrainz";

export type ResolveArtworkOptions = {
  /** Extra search terms tried first (e.g. soundtrack album name on the landing page). */
  searchHint?: string;
};

/** Best-effort album / release artwork for a piece title + composer (artist). */
export async function resolveArtworkUrl(
  title: string,
  composer: string | null,
  options?: ResolveArtworkOptions
): Promise<string | null> {
  const extraTerms = options?.searchHint?.trim() ? [options.searchHint.trim()] : [];

  const fromItunes = await fetchArtworkUrlFromItunes(title, composer, extraTerms);
  if (fromItunes) return fromItunes;

  return fetchArtworkUrlFromMusicBrainz(title, composer, options?.searchHint);
}
