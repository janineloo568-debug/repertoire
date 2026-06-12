import { and, count, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  notes,
  pieceTags,
  pieceVibeScores,
  pieces,
  ratings,
  tags,
  users,
} from "@/lib/db/schema";
import type { PublicProfileData } from "@/lib/profile/types";
import { dedupePiecesInSwimlane } from "@/lib/profile/dedupe-pieces";
import { profileAvatarUrl } from "@/lib/profile/section-theme";
import { normalizeUsername } from "@/lib/validations/username";

export async function getUserByUsername(username: string) {
  const slug = normalizeUsername(username);
  const row = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      bio: users.bio,
      instrumentsPlayed: users.instrumentsPlayed,
      avatarStorageKey: users.avatarStorageKey,
    })
    .from(users)
    .where(eq(users.username, slug))
    .limit(1);
  const user = row[0];
  if (!user?.username) return null;
  return user;
}

export type PublicPieceTag = {
  id: string;
  displayName: string;
  fitScore: number | null;
};

export type PublicPieceRow = {
  id: string;
  title: string;
  composer: string | null;
  instrument: string;
  difficulty: number;
  difficultyUser: number | null;
  repertoireStatus: (typeof pieces.$inferSelect)["repertoireStatus"];
  overallRating: number | null;
  tags: PublicPieceTag[];
  publicNote: string | null;
};

async function enrichPublicPieces(
  pieceRows: (typeof pieces.$inferSelect)[]
): Promise<PublicPieceRow[]> {
  if (pieceRows.length === 0) return [];

  const ids = pieceRows.map((p) => p.id);
  const userId = pieceRows[0]!.userId;

  const tagRowsFixed = await db
    .select({
      pieceId: pieceTags.pieceId,
      tagId: tags.id,
      displayName: tags.displayName,
    })
    .from(pieceTags)
    .innerJoin(tags, eq(tags.id, pieceTags.tagId))
    .where(inArray(pieceTags.pieceId, ids));

  const vibeRows = await db
    .select({
      pieceId: pieceVibeScores.pieceId,
      tagId: pieceVibeScores.tagId,
      fitScore: pieceVibeScores.fitScore,
    })
    .from(pieceVibeScores)
    .where(and(eq(pieceVibeScores.userId, userId), inArray(pieceVibeScores.pieceId, ids)));

  const vibeByPieceTag = new Map<string, number>();
  for (const v of vibeRows) {
    vibeByPieceTag.set(`${v.pieceId}:${v.tagId}`, v.fitScore);
  }

  const tagsByPiece = new Map<string, PublicPieceTag[]>();
  for (const tr of tagRowsFixed) {
    const list = tagsByPiece.get(tr.pieceId) ?? [];
    if (list.some((t) => t.id === tr.tagId)) continue;
    list.push({
      id: tr.tagId,
      displayName: tr.displayName,
      fitScore: vibeByPieceTag.get(`${tr.pieceId}:${tr.tagId}`) ?? null,
    });
    tagsByPiece.set(tr.pieceId, list);
  }

  const ratingRows = await db
    .select({
      pieceId: ratings.pieceId,
      overall: ratings.overall,
      difficultyUser: ratings.difficultyUser,
    })
    .from(ratings)
    .where(and(eq(ratings.userId, userId), inArray(ratings.pieceId, ids)));

  const ratingsByPiece = new Map(
    ratingRows.map((r) => [r.pieceId, { overall: r.overall, difficultyUser: r.difficultyUser }])
  );

  const noteRows = await db
    .select({ pieceId: notes.pieceId, body: notes.body })
    .from(notes)
    .where(
      and(eq(notes.userId, userId), eq(notes.isPublic, true), inArray(notes.pieceId, ids))
    );

  const notesByPiece = new Map(noteRows.map((n) => [n.pieceId, n.body]));

  return pieceRows.map((p) => {
    const rating = ratingsByPiece.get(p.id);
    return {
      id: p.id,
      title: p.title,
      composer: p.composer,
      instrument: p.instrument,
      difficulty: p.difficulty,
      difficultyUser: rating?.difficultyUser ?? null,
      repertoireStatus: p.repertoireStatus,
      overallRating: rating?.overall ?? null,
      tags: tagsByPiece.get(p.id) ?? [],
      publicNote: notesByPiece.get(p.id) ?? null,
    };
  });
}

export async function listPublicPiecesForUser(userId: string) {
  const rows = await db
    .select()
    .from(pieces)
    .where(and(eq(pieces.userId, userId), eq(pieces.isPublic, true)))
    .orderBy(desc(pieces.dateAdded));

  return enrichPublicPieces(rows);
}

export async function getPublicPieceForUser(pieceId: string, ownerUserId: string) {
  const row = await db
    .select()
    .from(pieces)
    .where(
      and(eq(pieces.id, pieceId), eq(pieces.userId, ownerUserId), eq(pieces.isPublic, true))
    )
    .limit(1);

  const piece = row[0];
  if (!piece) return null;

  const enriched = await enrichPublicPieces([piece]);
  return enriched[0] ?? null;
}

export async function countLibraryPiecesForUser(userId: string) {
  const row = await db
    .select({ n: count() })
    .from(pieces)
    .where(eq(pieces.userId, userId));
  return row[0]?.n ?? 0;
}

export function collectProfileVibeTags(pieceLists: PublicPieceRow[][]) {
  const map = new Map<string, string>();
  for (const list of pieceLists) {
    for (const piece of list) {
      for (const tag of piece.tags) {
        map.set(tag.id, tag.displayName);
      }
    }
  }
  return [...map.entries()]
    .map(([id, displayName]) => ({ id, displayName }))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));
}

export async function getPublicProfileByUsername(username: string) {
  const user = await getUserByUsername(username);
  if (!user) return null;

  const [rawPieces, totalLibraryCount] = await Promise.all([
    listPublicPiecesForUser(user.id),
    countLibraryPiecesForUser(user.id),
  ]);
  const allPieces = dedupePiecesInSwimlane(rawPieces);

  const learning = dedupePiecesInSwimlane(
    allPieces.filter((p) => p.repertoireStatus === "learning")
  );
  const mastered = dedupePiecesInSwimlane(
    allPieces.filter((p) => p.repertoireStatus === "mastered")
  );
  const saved = dedupePiecesInSwimlane(allPieces.filter((p) => p.repertoireStatus === "saved"));

  const slug = user.username!;
  const profile: PublicProfileData = {
    user: {
      id: user.id,
      name: user.name,
      username: slug,
      bio: user.bio ?? null,
      instrumentsPlayed: (user.instrumentsPlayed ?? []) as string[],
      avatarUrl: profileAvatarUrl(slug, !!user.avatarStorageKey),
    },
    totalLibraryCount,
    publicPieceCount: allPieces.length,
    vibeTags: collectProfileVibeTags([learning, mastered, saved]),
    learning,
    mastered,
    saved,
  };
  return profile;
}
