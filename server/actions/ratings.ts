"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { pieceTags, pieceVibeScores, ratings } from "@/lib/db/schema";
import { getPieceForUser } from "@/lib/queries/pieces";

const ratingSchema = z.object({
  pieceId: z.string().uuid(),
  overall: z.coerce.number().int().min(1).max(5),
  difficultyUser: z.coerce.number().int().min(1).max(5),
});

export async function upsertRating(input: z.infer<typeof ratingSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = ratingSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const { pieceId, overall, difficultyUser } = parsed.data;
  const existing = await getPieceForUser(pieceId, session.user.id);
  if (!existing) return { error: "not_found" as const };

  await db
    .insert(ratings)
    .values({
      pieceId,
      userId: session.user.id,
      overall,
      difficultyUser,
    })
    .onConflictDoUpdate({
      target: [ratings.pieceId, ratings.userId],
      set: { overall, difficultyUser, updatedAt: new Date() },
    });

  revalidatePath("/library");
  revalidatePath(`/library/${pieceId}`);
  revalidatePath("/suggestions");
  return { ok: true as const, shouldRefreshSuggestions: overall >= 4 };
}

const vibeSchema = z.object({
  pieceId: z.string().uuid(),
  tagId: z.string().uuid(),
  fitScore: z.coerce.number().int().min(1).max(5),
});

export async function upsertVibeScore(input: z.infer<typeof vibeSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = vibeSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const { pieceId, tagId, fitScore } = parsed.data;

  const pt = await db
    .select({ pieceId: pieceTags.pieceId })
    .from(pieceTags)
    .where(and(eq(pieceTags.pieceId, pieceId), eq(pieceTags.tagId, tagId)))
    .limit(1);

  if (!pt[0]) {
    return { error: "tag_not_on_piece" as const };
  }

  await db
    .insert(pieceVibeScores)
    .values({
      pieceId,
      tagId,
      userId: session.user.id,
      fitScore,
    })
    .onConflictDoUpdate({
      target: [pieceVibeScores.pieceId, pieceVibeScores.tagId, pieceVibeScores.userId],
      set: { fitScore, updatedAt: new Date() },
    });

  revalidatePath(`/library/${pieceId}`);
  return { ok: true as const };
}
