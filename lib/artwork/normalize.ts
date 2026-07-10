/** Lowercase, strip accents/punctuation for fuzzy title/composer matching. */
export function normalizeArtworkText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function artworkTokens(value: string): string[] {
  return normalizeArtworkText(value)
    .split(" ")
    .filter((token) => token.length > 1);
}

export function tokenOverlap(a: string, b: string): number {
  const left = new Set(artworkTokens(a));
  const right = new Set(artworkTokens(b));
  let overlap = 0;
  for (const token of left) {
    if (right.has(token)) overlap += 1;
  }
  return overlap;
}

export function containsNormalized(haystack: string, needle: string): boolean {
  const h = normalizeArtworkText(haystack);
  const n = normalizeArtworkText(needle);
  if (!n) return false;
  return h.includes(n);
}
