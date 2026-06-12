import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { notes, pieceTags, pieces, ratings, tags } from "@/lib/db/schema";

export type LibraryContext = {
  instrumentsSummary: string;
  favoriteVibes: string;
  lovedPieces: string[];
  ownedTitles: string[];
};

export async function buildLibraryContext(userId: string): Promise<LibraryContext> {
  const owned = await db
    .select({ title: pieces.title })
    .from(pieces)
    .where(eq(pieces.userId, userId));

  const ownedTitles = owned.map((r) => r.title);

  const instRows = await db
    .select({
      instrument: pieces.instrument,
      n: sql<number>`cast(count(*) as integer)`,
    })
    .from(pieces)
    .where(eq(pieces.userId, userId))
    .groupBy(pieces.instrument);

  const instrumentsSummary =
    instRows.length === 0
      ? "unknown"
      : instRows
          .sort((a, b) => b.n - a.n)
          .map((r) => `${r.instrument} (${r.n})`)
          .join(", ");

  const rated = await db
    .select({
      piece: pieces,
      overall: ratings.overall,
      noteBody: notes.body,
    })
    .from(pieces)
    .innerJoin(ratings, and(eq(ratings.pieceId, pieces.id), eq(ratings.userId, userId)))
    .leftJoin(notes, and(eq(notes.pieceId, pieces.id), eq(notes.userId, userId)))
    .where(and(eq(pieces.userId, userId), gte(ratings.overall, 4)))
    .orderBy(desc(ratings.overall))
    .limit(15);

  const pieceIds = rated.map((r) => r.piece.id);
  let tagLabels = new Map<string, string[]>();

  if (pieceIds.length > 0) {
    const tr = await db
      .select({
        pieceId: pieceTags.pieceId,
        displayName: tags.displayName,
      })
      .from(pieceTags)
      .innerJoin(tags, eq(tags.id, pieceTags.tagId))
      .where(inArray(pieceTags.pieceId, pieceIds));

    tagLabels = tr.reduce((acc, row) => {
      const list = acc.get(row.pieceId) ?? [];
      list.push(row.displayName);
      acc.set(row.pieceId, list);
      return acc;
    }, new Map<string, string[]>());
  }

  const lovedPieces = rated.map((r) => {
    const p = r.piece;
    const tagStr = (tagLabels.get(p.id) ?? []).join(", ");
    const noteExcerpt = r.noteBody ? r.noteBody.slice(0, 120).replace(/\s+/g, " ") : "";
    return `${p.title} / ${p.composer ?? "?"} / ${p.instrument} / diff ${p.difficulty} / tags: ${tagStr}${noteExcerpt ? ` / note: ${noteExcerpt}` : ""}`;
  });

  const vibeCounts = await db
    .select({
      displayName: tags.displayName,
      n: sql<number>`cast(count(*) as integer)`,
    })
    .from(pieceTags)
    .innerJoin(tags, eq(tags.id, pieceTags.tagId))
    .innerJoin(pieces, eq(pieces.id, pieceTags.pieceId))
    .innerJoin(ratings, and(eq(ratings.pieceId, pieces.id), eq(ratings.userId, userId)))
    .where(and(eq(pieces.userId, userId), gte(ratings.overall, 4)))
    .groupBy(tags.displayName)
    .limit(8);

  const favoriteVibes =
    vibeCounts.length === 0
      ? "not enough data — infer from instruments"
      : vibeCounts.map((v) => `${v.displayName} (${v.n})`).join(", ");

  return {
    instrumentsSummary,
    favoriteVibes,
    lovedPieces:
      lovedPieces.length > 0
        ? lovedPieces
        : ["(No highly rated pieces yet — suggest approachable repertoire for mixed libraries.)"],
    ownedTitles,
  };
}
