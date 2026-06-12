"use server";

import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { recordFeedActivity } from "@/lib/activity/record";
import { db } from "@/lib/db";
import { pieceTags, pieces, tags, users } from "@/lib/db/schema";
import { getPieceForUser } from "@/lib/queries/pieces";
import { pieceFormSchema } from "@/lib/validations/piece";

const createPieceSchema = pieceFormSchema
  .extend({
    storageKey: z.string().min(1).optional().nullable(),
    mimeType: z.string().optional().nullable(),
    fileNameOriginal: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.sourceType === "external_link" && !data.externalUrl) {
      ctx.addIssue({ code: "custom", path: ["externalUrl"], message: "URL is required" });
    }
    if (data.sourceType === "upload" && !data.storageKey) {
      ctx.addIssue({ code: "custom", path: ["file"], message: "File upload is required" });
    }
  })
  .extend({
    isPublic: z.boolean().optional(),
    repertoireStatus: z.enum(["learning", "mastered", "saved"]).optional(),
  });

export type CreatePieceInput = z.infer<typeof createPieceSchema>;

function actionError(message: string) {
  return { error: { _form: [message] } as Record<string, string[]> };
}

async function revalidateProfilePaths(userId: string) {
  const row = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  revalidatePath("/feed");
  revalidatePath("/library");
  if (row[0]?.username) revalidatePath(`/u/${row[0].username}`);
}

export async function createPiece(input: CreatePieceInput) {
  const session = await auth();
  if (!session?.user?.id) {
    return actionError("Please sign in to add pieces.");
  }

  const parsed = createPieceSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const d = parsed.data;

  try {
    const [row] = await db
      .insert(pieces)
      .values({
        userId: session.user.id,
        title: d.title,
        composer: d.composer ?? null,
        instrument: d.instrument,
        difficulty: d.difficulty,
        sourceType: d.sourceType,
        storageKey: d.sourceType === "upload" ? d.storageKey! : null,
        externalUrl: d.sourceType === "external_link" ? d.externalUrl! : null,
        mimeType: d.mimeType ?? (d.sourceType === "upload" ? "application/pdf" : null),
        fileNameOriginal: d.fileNameOriginal ?? null,
        isPublic: d.isPublic ?? false,
        repertoireStatus: d.repertoireStatus ?? "learning",
      })
      .returning({ id: pieces.id });

    if (!row?.id) {
      return actionError("Could not save piece. Please try again.");
    }

    if (d.isPublic ?? false) {
      await recordFeedActivity({
        userId: session.user.id,
        type: "piece_added",
        pieceId: row.id,
      });
    }

    await revalidateProfilePaths(session.user.id);
    return { id: row.id };
  } catch (err) {
    console.error("createPiece failed", err);
    return actionError("Could not save piece. Sign out, sign in again, and retry.");
  }
}

export async function updatePiece(input: {
  id: string;
  title?: string;
  composer?: string | null;
  instrument?: z.infer<typeof pieceFormSchema>["instrument"];
  difficulty?: number;
  externalUrl?: string | null;
  repertoireStatus?: "learning" | "mastered" | "saved";
  isPublic?: boolean;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existing = await getPieceForUser(input.id, session.user.id);
  if (!existing) return { error: "not_found" as const };

  const prev = existing.piece;
  const wasPublic = prev.isPublic;
  const prevStatus = prev.repertoireStatus;

  await db
    .update(pieces)
    .set({
      ...(input.title != null ? { title: input.title } : {}),
      ...(input.composer !== undefined ? { composer: input.composer } : {}),
      ...(input.instrument != null ? { instrument: input.instrument } : {}),
      ...(input.difficulty != null ? { difficulty: input.difficulty } : {}),
      ...(input.externalUrl !== undefined ? { externalUrl: input.externalUrl } : {}),
      ...(input.repertoireStatus != null ? { repertoireStatus: input.repertoireStatus } : {}),
      ...(input.isPublic !== undefined ? { isPublic: input.isPublic } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(pieces.id, input.id), eq(pieces.userId, session.user.id)));

  const nextPublic = input.isPublic ?? wasPublic;
  const nextStatus = input.repertoireStatus ?? prevStatus;

  if (nextPublic && !wasPublic) {
    await recordFeedActivity({
      userId: session.user.id,
      type: "piece_added",
      pieceId: input.id,
    });
  }

  if (nextPublic && prevStatus === "learning" && nextStatus === "mastered") {
    await recordFeedActivity({
      userId: session.user.id,
      type: "piece_mastered",
      pieceId: input.id,
    });
  }

  await revalidateProfilePaths(session.user.id);
  revalidatePath(`/library/${input.id}`);
  return { ok: true as const };
}

export async function deletePiece(pieceId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  await db
    .delete(pieces)
    .where(and(eq(pieces.id, pieceId), eq(pieces.userId, session.user.id)));

  revalidatePath("/library");
  return { ok: true as const };
}

const setTagsSchema = z.object({
  pieceId: z.string().uuid(),
  tagIds: z.array(z.string().uuid()),
});

export async function setPieceTags(input: z.infer<typeof setTagsSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = setTagsSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const { pieceId, tagIds } = parsed.data;
  const existing = await getPieceForUser(pieceId, session.user.id);
  if (!existing) return { error: "not_found" as const };

  const previousTagRows = await db
    .select({ tagId: pieceTags.tagId })
    .from(pieceTags)
    .where(eq(pieceTags.pieceId, pieceId));
  const previousTagIds = new Set(previousTagRows.map((r) => r.tagId));

  const unique = [...new Set(tagIds)];
  if (unique.length > 0) {
    const tagRows = await db
      .select({ id: tags.id })
      .from(tags)
      .where(
        and(
          inArray(tags.id, unique),
          or(isNull(tags.userId), eq(tags.userId, session.user.id))
        )
      );

    if (tagRows.length !== unique.length) {
      return { error: "invalid_tag" as const };
    }
  }

  await db.delete(pieceTags).where(eq(pieceTags.pieceId, pieceId));
  if (unique.length > 0) {
    await db.insert(pieceTags).values(unique.map((tagId) => ({ pieceId, tagId })));
  }

  if (existing.piece.isPublic) {
    const addedTagIds = unique.filter((id) => !previousTagIds.has(id));
    for (const tagId of addedTagIds) {
      await recordFeedActivity({
        userId: session.user.id,
        type: "tag_added",
        pieceId,
        tagId,
      });
    }
  }

  await revalidateProfilePaths(session.user.id);
  revalidatePath(`/library/${pieceId}`);
  return { ok: true as const };
}
