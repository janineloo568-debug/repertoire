import { and, desc, eq, gte, inArray, like, lte, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/lib/db";
import { notes, piecePracticeGoals, pieceTags, pieceVibeScores, pieces, practiceLogs, ratings, tags } from "@/lib/db/schema";
import { goalsAreConfigured, serializePracticeLog } from "@/lib/queries/practice-logs";

export type PieceFilters = {
  search?: string;
  instrument?: string;
  tagIds?: string[];
  minDifficulty?: number;
  maxDifficulty?: number;
};

export async function listPiecesForUser(userId: string, filters: PieceFilters = {}) {
  const conditions: SQL[] = [eq(pieces.userId, userId)];

  if (filters.search?.trim()) {
    const q = `%${filters.search.trim()}%`;
    conditions.push(or(like(pieces.title, q), like(pieces.composer, q))!);
  }

  if (filters.instrument && filters.instrument !== "all") {
    conditions.push(
      eq(pieces.instrument, filters.instrument as (typeof pieces.$inferSelect)["instrument"])
    );
  }

  if (filters.minDifficulty != null) {
    conditions.push(gte(pieces.difficulty, filters.minDifficulty));
  }
  if (filters.maxDifficulty != null) {
    conditions.push(lte(pieces.difficulty, filters.maxDifficulty));
  }

  if (filters.tagIds && filters.tagIds.length > 0) {
    const n = filters.tagIds.length;
    const rows = await db
      .select({ pieceId: pieceTags.pieceId })
      .from(pieceTags)
      .where(inArray(pieceTags.tagId, filters.tagIds))
      .groupBy(pieceTags.pieceId)
      .having(sql`cast(count(*) as integer) = ${n}`);

    const pieceIdsFiltered = rows.map((r) => r.pieceId);
    if (pieceIdsFiltered.length === 0) {
      return [];
    }
    conditions.push(inArray(pieces.id, pieceIdsFiltered));
  }

  const rows = await db
    .select({
      piece: pieces,
      overall: ratings.overall,
    })
    .from(pieces)
    .leftJoin(
      ratings,
      and(eq(ratings.pieceId, pieces.id), eq(ratings.userId, userId))
    )
    .where(and(...(conditions as [SQL, ...SQL[]])))
    .orderBy(desc(pieces.dateAdded));

  const ids = rows.map((r) => r.piece.id);
  if (ids.length === 0) return [];

  const tagRows = await db
    .select({
      pieceId: pieceTags.pieceId,
      tagId: tags.id,
      displayName: tags.displayName,
      slug: tags.slug,
    })
    .from(pieceTags)
    .innerJoin(tags, eq(tags.id, pieceTags.tagId))
    .where(inArray(pieceTags.pieceId, ids));

  const tagsByPiece = new Map<string, { id: string; displayName: string; slug: string }[]>();
  for (const tr of tagRows) {
    const list = tagsByPiece.get(tr.pieceId) ?? [];
    list.push({ id: tr.tagId, displayName: tr.displayName, slug: tr.slug });
    tagsByPiece.set(tr.pieceId, list);
  }

  return rows.map((r) => ({
    ...r.piece,
    overallRating: r.overall,
    tags: tagsByPiece.get(r.piece.id) ?? [],
  }));
}

export async function getPieceForUser(pieceId: string, userId: string) {
  const row = await db
    .select()
    .from(pieces)
    .where(and(eq(pieces.id, pieceId), eq(pieces.userId, userId)))
    .limit(1);

  const piece = row[0];
  if (!piece) return null;

  const [ratingRow] = await db
    .select()
    .from(ratings)
    .where(and(eq(ratings.pieceId, pieceId), eq(ratings.userId, userId)))
    .limit(1);

  const tagRows = await db
    .select({ tag: tags })
    .from(pieceTags)
    .innerJoin(tags, eq(tags.id, pieceTags.tagId))
    .where(eq(pieceTags.pieceId, pieceId));

  const vibeRows = await db
    .select()
    .from(pieceVibeScores)
    .where(and(eq(pieceVibeScores.pieceId, pieceId), eq(pieceVibeScores.userId, userId)));

  const [noteRow] = await db
    .select()
    .from(notes)
    .where(and(eq(notes.pieceId, pieceId), eq(notes.userId, userId)))
    .limit(1);

  let practiceLogRows: (typeof practiceLogs.$inferSelect)[] = [];
  try {
    practiceLogRows = await db
      .select()
      .from(practiceLogs)
      .where(and(eq(practiceLogs.pieceId, pieceId), eq(practiceLogs.userId, userId)))
      .orderBy(desc(practiceLogs.createdAt))
      .limit(20);
  } catch {
    practiceLogRows = [];
  }

  const [practiceGoalRow] = await db
    .select()
    .from(piecePracticeGoals)
    .where(and(eq(piecePracticeGoals.pieceId, pieceId), eq(piecePracticeGoals.userId, userId)))
    .limit(1);

  const clippedSessionCount = practiceLogRows.filter((l) => l.audioStorageKey).length;

  return {
    piece,
    rating: ratingRow ?? null,
    tags: tagRows.map((t) => t.tag),
    vibeScores: vibeRows,
    note: noteRow ?? null,
    practiceLogs: practiceLogRows.map(serializePracticeLog),
    practiceGoal: practiceGoalRow ?? null,
    clippedSessionCount,
    goalsConfigured: goalsAreConfigured(practiceGoalRow ?? null),
  };
}
