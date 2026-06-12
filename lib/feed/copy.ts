import type { FeedItem } from "@/lib/queries/feed";

function pieceLine(piece: FeedItem["piece"]) {
  const composer = piece.composer ? ` · ${piece.composer}` : "";
  return `${piece.title}${composer}`;
}

export function feedActivitySummary(item: FeedItem) {
  const line = pieceLine(item.piece);
  switch (item.type) {
    case "piece_added":
      return { verb: "added to their library", pieceLine: line };
    case "piece_mastered":
      return { verb: "moved to Mastered", pieceLine: line };
    case "public_note":
      return { verb: "left a public note on", pieceLine: line };
    case "tag_added":
      return {
        verb: item.tag ? `added to vibe` : "tagged",
        pieceLine: line,
        tagName: item.tag?.displayName,
      };
    default:
      return { verb: "updated", pieceLine: line };
  }
}

export function displayName(actor: FeedItem["actor"]) {
  return actor.name?.trim() || actor.username;
}
