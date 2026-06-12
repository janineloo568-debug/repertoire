import { and, desc, eq, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  feedActivities,
  follows,
  pieces,
  tags,
  users,
} from "@/lib/db/schema";

export type FeedItem = {
  id: string;
  type: (typeof feedActivities.$inferSelect)["type"];
  createdAt: Date;
  actor: { id: string; name: string | null; username: string };
  piece: {
    id: string;
    title: string;
    composer: string | null;
    instrument: string;
    difficulty: number;
    externalUrl: string | null;
    sourceType: string;
  };
  tag: { id: string; displayName: string } | null;
  noteExcerpt: string | null;
};

export async function listFeedForUser(viewerId: string, limit = 50): Promise<FeedItem[]> {
  const followingRows = await db
    .select({ followingId: follows.followingId })
    .from(follows)
    .where(eq(follows.followerId, viewerId));

  const followingIds = followingRows.map((r) => r.followingId);
  if (followingIds.length === 0) return [];

  const rows = await db
    .select({
      activity: feedActivities,
      actorName: users.name,
      actorUsername: users.username,
      actorId: users.id,
      piece: pieces,
      tagDisplayName: tags.displayName,
      tagId: tags.id,
    })
    .from(feedActivities)
    .innerJoin(users, eq(users.id, feedActivities.userId))
    .innerJoin(pieces, eq(pieces.id, feedActivities.pieceId))
    .leftJoin(tags, eq(tags.id, feedActivities.tagId))
    .where(
      and(
        inArray(feedActivities.userId, followingIds),
        eq(pieces.isPublic, true),
        isNotNull(users.username)
      )
    )
    .orderBy(desc(feedActivities.createdAt))
    .limit(limit);

  return rows
    .filter((r) => r.actorUsername)
    .map((r) => ({
      id: r.activity.id,
      type: r.activity.type,
      createdAt: r.activity.createdAt,
      actor: {
        id: r.actorId,
        name: r.actorName,
        username: r.actorUsername!,
      },
      piece: {
        id: r.piece.id,
        title: r.piece.title,
        composer: r.piece.composer,
        instrument: r.piece.instrument,
        difficulty: r.piece.difficulty,
        externalUrl: r.piece.externalUrl,
        sourceType: r.piece.sourceType,
      },
      tag: r.tagId && r.tagDisplayName ? { id: r.tagId, displayName: r.tagDisplayName } : null,
      noteExcerpt: r.activity.noteExcerpt,
    }));
}

export async function listSuggestedProfiles(viewerId: string, limit = 4) {
  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      publicPieceCount: sql<number>`count(${pieces.id})`.as("public_piece_count"),
    })
    .from(users)
    .innerJoin(pieces, and(eq(pieces.userId, users.id), eq(pieces.isPublic, true)))
    .where(and(isNotNull(users.username), ne(users.id, viewerId)))
    .groupBy(users.id, users.name, users.username)
    .having(sql`count(${pieces.id}) >= 1`)
    .orderBy(desc(sql`count(${pieces.id})`))
    .limit(limit);

  return rows
    .filter((r) => r.username)
    .map((r) => ({
      id: r.id,
      name: r.name,
      username: r.username!,
      publicPieceCount: Number(r.publicPieceCount),
    }));
}

export async function isFollowing(followerId: string, followingId: string) {
  const row = await db
    .select({ followerId: follows.followerId })
    .from(follows)
    .where(and(eq(follows.followerId, followerId), eq(follows.followingId, followingId)))
    .limit(1);
  return !!row[0];
}
