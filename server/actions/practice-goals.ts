"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { parsePracticeGoals, parsedGoalsToStored } from "@/lib/ai/parsePracticeGoals";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { piecePracticeGoals } from "@/lib/db/schema";
import { formatParsedGoalsSummary } from "@/lib/queries/practice-goals-display";
import { getPieceForUser } from "@/lib/queries/pieces";

const goalsSchema = z.object({
  pieceId: z.string().uuid(),
  goalsText: z.string().trim().min(1, "Describe what you're aiming for.").max(4000),
});

export async function upsertPracticeGoals(input: z.infer<typeof goalsSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = goalsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors.goalsText?.[0] ?? "Invalid goals" };
  }

  const { pieceId, goalsText } = parsed.data;
  const existing = await getPieceForUser(pieceId, session.user.id);
  if (!existing) return { error: "not_found" as const };

  const extracted = await parsePracticeGoals(goalsText, {
    title: existing.piece.title,
    instrument: existing.piece.instrument,
  });
  const stored = parsedGoalsToStored(extracted);

  const values = {
    pieceId,
    userId: session.user.id,
    goalsText,
    targetTempoBpm: stored.targetTempoBpm,
    dynamicsNotes: stored.dynamicsNotes,
    emotionNotes: stored.emotionNotes,
    passageNotes: stored.passageNotes,
    updatedAt: new Date(),
  };

  await db
    .insert(piecePracticeGoals)
    .values(values)
    .onConflictDoUpdate({
      target: piecePracticeGoals.pieceId,
      set: {
        goalsText: values.goalsText,
        targetTempoBpm: values.targetTempoBpm,
        dynamicsNotes: values.dynamicsNotes,
        emotionNotes: values.emotionNotes,
        passageNotes: values.passageNotes,
        updatedAt: values.updatedAt,
      },
    });

  revalidatePath(`/library/${pieceId}`);

  return {
    ok: true as const,
    parsedSummary: formatParsedGoalsSummary({
      targetTempoBpm: stored.targetTempoBpm,
      passageNotes: stored.passageNotes,
      dynamicsNotes: stored.dynamicsNotes,
      emotionNotes: stored.emotionNotes,
    }),
  };
}
