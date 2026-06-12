import type { PublicPieceRow } from "@/lib/queries/public-profile";

/** Normalize titles so "No. 1" / "No.1" / extra spaces match. */
export function normalizePieceTitle(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[''""`]/g, "")
    .replace(/\s+/g, " ")
    .replace(/\bno\.?\s*/g, "no ")
    .replace(/\s*\([^)]*\)\s*/g, " ")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\s+in\s+[a-g](?:\s*flat|\s*sharp|#|b)?(?:\s+major|\s+minor)?\s*$/i, "")
    .trim();
}

/** One card per work in a swimlane (id, then title+instrument). */
export function swimlaneKey(p: PublicPieceRow): string {
  return `${normalizePieceTitle(p.title)}|${p.instrument.trim().toLowerCase()}`;
}

/**
 * One card per piece in a swimlane: duplicate ids, duplicate title+instrument,
 * and near-duplicate titles (e.g. same work with/without composer in metadata).
 */
export function dedupePiecesInSwimlane(pieces: PublicPieceRow[]): PublicPieceRow[] {
  const seenIds = new Set<string>();
  const seenLaneKeys = new Set<string>();
  const out: PublicPieceRow[] = [];

  for (const p of pieces) {
    if (seenIds.has(p.id)) continue;
    const lane = swimlaneKey(p);
    if (seenLaneKeys.has(lane)) continue;
    seenIds.add(p.id);
    seenLaneKeys.add(lane);
    out.push(p);
  }

  return out;
}
