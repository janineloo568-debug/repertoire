"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { recordFeedActivity } from "@/lib/activity/record";
import { db } from "@/lib/db";
import { notes, users } from "@/lib/db/schema";
import { getPieceForUser } from "@/lib/queries/pieces";

const noteSchema = z.object({
  pieceId: z.string().uuid(),
  body: z.string().max(20000),
  isPublic: z.boolean().optional(),
});

export async function upsertNote(input: z.infer<typeof noteSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const { pieceId, body, isPublic } = parsed.data;
  const existing = await getPieceForUser(pieceId, session.user.id);
  if (!existing) return { error: "not_found" as const };

  const makePublic = isPublic ?? false;
  const trimmed = body.trim();

  const current = await db
    .select({ id: notes.id, isPublic: notes.isPublic })
    .from(notes)
    .where(and(eq(notes.pieceId, pieceId), eq(notes.userId, session.user.id)))
    .limit(1);

  if (current[0]) {
    await db
      .update(notes)
      .set({ body, isPublic: makePublic, updatedAt: new Date() })
      .where(eq(notes.id, current[0].id));
  } else {
    await db.insert(notes).values({
      pieceId,
      userId: session.user.id,
      body,
      isPublic: makePublic,
    });
  }

  if (existing.piece.isPublic && makePublic && trimmed.length > 0) {
    await recordFeedActivity({
      userId: session.user.id,
      type: "public_note",
      pieceId,
      noteExcerpt: trimmed,
    });
  }

  const profile = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  revalidatePath(`/library/${pieceId}`);
  revalidatePath("/library");
  revalidatePath("/feed");
  if (profile[0]?.username) revalidatePath(`/u/${profile[0].username}`);
  return { ok: true as const };
}
