"use server";

import { APIError } from "openai";
import { and, eq, isNotNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { fetchComparisonPracticeCoach } from "@/lib/ai/practiceCoach";
import type { PracticeCoachResponseParsed } from "@/lib/ai/schemas";
import { analyzePracticeClip } from "@/lib/audio/analyzeClip";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { practiceLogs } from "@/lib/db/schema";
import {
  buildComparisonCoachContext,
  getPracticeGoals,
} from "@/lib/queries/practice-context";
import { goalsAreConfigured, serializePracticeLog } from "@/lib/queries/practice-logs";
import { getPieceForUser } from "@/lib/queries/pieces";
import { isAllowedPracticeAudio, savePracticeAudio } from "@/lib/storage";

const MIN_CLIPPED_SESSIONS = 2;

export async function createPracticeLog(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const pieceId = formData.get("pieceId");
  const passageNotesRaw = formData.get("passageNotes");
  const audio = formData.get("audio");

  if (typeof pieceId !== "string") return { error: "Invalid piece" };
  if (!(audio instanceof File) || audio.size === 0) {
    return { error: "Upload a 15–30 second clip of your playing." };
  }

  const passageNotes = typeof passageNotesRaw === "string" ? passageNotesRaw.trim() : "";

  const existing = await getPieceForUser(pieceId, session.user.id);
  if (!existing) return { error: "not_found" as const };

  const goals = await getPracticeGoals(pieceId, session.user.id);
  if (!goalsAreConfigured(goals)) {
    return {
      error: "Save your practice goals (tempo, dynamics, or emotion) before logging a session.",
    };
  }

  const mimeType = audio.type || "application/octet-stream";
  if (!isAllowedPracticeAudio(mimeType)) {
    return { error: "Use MP3, WAV, WebM, M4A, or OGG for your clip." };
  }

  const buffer = Buffer.from(await audio.arrayBuffer());

  let analysis;
  try {
    analysis = await analyzePracticeClip(buffer);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not analyze audio clip." };
  }

  let storage;
  try {
    storage = await savePracticeAudio(session.user.id, buffer, mimeType);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not save audio clip." };
  }

  const priorClipped = await db
    .select({ id: practiceLogs.id })
    .from(practiceLogs)
    .where(
      and(
        eq(practiceLogs.pieceId, pieceId),
        eq(practiceLogs.userId, session.user.id),
        isNotNull(practiceLogs.audioStorageKey)
      )
    );

  const priorCount = priorClipped.length;
  const body = passageNotes || `Practice clip · ${analysis.durationSec}s`;

  const [log] = await db
    .insert(practiceLogs)
    .values({
      pieceId,
      userId: session.user.id,
      body,
      passageNotes,
      audioStorageKey: storage.storageKey,
      audioMimeType: storage.mimeType,
      audioAnalysis: analysis,
      coachResponse: null,
    })
    .returning();

  const clippedSessionCount = priorCount + 1;
  let coachResponse: PracticeCoachResponseParsed | null = null;
  let coachMessage: string | null = null;

  if (clippedSessionCount < MIN_CLIPPED_SESSIONS) {
    coachMessage = `Session saved. Log ${MIN_CLIPPED_SESSIONS - clippedSessionCount} more clipped session${MIN_CLIPPED_SESSIONS - clippedSessionCount === 1 ? "" : "s"} — coach feedback unlocks after ${MIN_CLIPPED_SESSIONS} sessions with audio.`;
  } else {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      coachMessage = "Sessions saved. Add OPENAI_API_KEY to enable coach feedback.";
    } else {
      try {
        const context = await buildComparisonCoachContext(pieceId, session.user.id, log.id);
        if (!context) {
          coachMessage = "Sessions saved. Could not build comparison context for coaching.";
        } else {
          coachResponse = await fetchComparisonPracticeCoach(context);
          await db
            .update(practiceLogs)
            .set({ coachResponse })
            .where(eq(practiceLogs.id, log.id));
        }
      } catch (e) {
        if (e instanceof APIError) {
          coachMessage = e.message || "Coach request failed";
        } else {
          coachMessage = e instanceof Error ? e.message : "Could not reach the practice coach";
        }
      }
    }
  }

  revalidatePath(`/library/${pieceId}`);

  const serialized = serializePracticeLog({
    ...log,
    coachResponse: coachResponse ?? log.coachResponse,
  });

  return {
    ok: true as const,
    log: serialized,
    coachResponse,
    coachMessage,
    clippedSessionCount,
    coachUnlocked: clippedSessionCount >= MIN_CLIPPED_SESSIONS,
  };
}
