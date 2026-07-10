import { containsNormalized, tokenOverlap } from "@/lib/artwork/normalize";

type MusicBrainzRelease = {
  id?: string;
  title?: string;
  "artist-credit"?: Array<{ name?: string; artist?: { name?: string } }>;
};

type MusicBrainzSearchResponse = {
  releases?: MusicBrainzRelease[];
};

function scoreRelease(release: MusicBrainzRelease, title: string, composer: string | null): number {
  const releaseTitle = release.title ?? "";
  const artistNames = (release["artist-credit"] ?? [])
    .map((credit) => credit.artist?.name ?? credit.name ?? "")
    .join(" ");

  let score = 0;
  if (containsNormalized(releaseTitle, title)) score += 5;
  else if (tokenOverlap(releaseTitle, title) >= 2) score += 3;

  const c = composer?.trim();
  if (c) {
    if (containsNormalized(artistNames, c)) score += 5;
    else if (tokenOverlap(artistNames, c) >= 2) score += 3;
    if (containsNormalized(releaseTitle, c)) score += 2;
  }

  return score;
}

async function fetchCoverArtForRelease(releaseId: string): Promise<string | null> {
  const res = await fetch(`https://coverartarchive.org/release/${releaseId}`, {
    headers: { Accept: "application/json" },
    next: { revalidate: 60 * 60 * 24 * 7 },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    images?: Array<{ front?: boolean; image?: string; thumbnails?: { small?: string; large?: string } }>;
  };

  const front = data.images?.find((image) => image.front) ?? data.images?.[0];
  return front?.thumbnails?.large ?? front?.image ?? null;
}

export async function fetchArtworkUrlFromMusicBrainz(
  title: string,
  composer: string | null,
  searchHint?: string
): Promise<string | null> {
  const trimmedTitle = title.trim();
  if (!trimmedTitle) return null;

  const c = composer?.trim();
  const hint = searchHint?.trim();
  const query = hint
    ? hint
    : c
      ? `release:"${trimmedTitle}" AND artist:"${c}"`
      : `release:"${trimmedTitle}"`;

  const url = `https://musicbrainz.org/ws/2/release/?query=${encodeURIComponent(query)}&fmt=json&limit=8`;

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "Repertoire/1.0 (https://github.com/janineloo568-debug/repertoire)",
    },
    next: { revalidate: 60 * 60 * 24 * 7 },
  });

  if (!res.ok) return null;

  const data = (await res.json()) as MusicBrainzSearchResponse;
  const releases = [...(data.releases ?? [])].sort(
    (a, b) => scoreRelease(b, trimmedTitle, composer) - scoreRelease(a, trimmedTitle, composer)
  );

  for (const release of releases.slice(0, 5)) {
    if (!release.id) continue;
    const score = scoreRelease(release, trimmedTitle, composer);
    if (score < 4) continue;

    const cover = await fetchCoverArtForRelease(release.id);
    if (cover) return cover;
  }

  return null;
}
