import { and, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { piecePracticeGoals, practiceLogs } from "@/lib/db/schema";
import { getPieceForUser } from "@/lib/queries/pieces";
import { formatAnalysisSummary, goalsAreConfigured } from "@/lib/queries/practice-logs";

export type ComparisonCoachContext = {
  piece: {
    title: string;
    composer: string | null;
    instrument: string;
    difficulty: number;
    repertoireStatus: string;
    tags: string[];
  };
  goals: {
    goalsText: string;
    targetTempoBpm: number | null;
    dynamicsNotes: string;
    emotionNotes: string;
    passageNotes: string;
  };
  previousSession: {
    createdAt: Date;
    passageNotes: string;
    analysisSummary: string;
    analysis: NonNullable<Awaited<ReturnType<typeof getPriorClippedSessions>>[0]["audioAnalysis"]>;
  };
  currentSession: {
    passageNotes: string;
    analysisSummary: string;
    analysis: NonNullable<Awaited<ReturnType<typeof getPriorClippedSessions>>[0]["audioAnalysis"]>;
  };
};

async function getPriorClippedSessions(pieceId: string, userId: string, limit = 5) {
  return db
    .select()
    .from(practiceLogs)
    .where(
      and(
        eq(practiceLogs.pieceId, pieceId),
        eq(practiceLogs.userId, userId),
        isNotNull(practiceLogs.audioStorageKey)
      )
    )
    .orderBy(desc(practiceLogs.createdAt))
    .limit(limit);
}

export async function countClippedSessions(pieceId: string, userId: string) {
  const rows = await getPriorClippedSessions(pieceId, userId, 100);
  return rows.length;
}

export async function getPracticeGoals(pieceId: string, userId: string) {
  const [row] = await db
    .select()
    .from(piecePracticeGoals)
    .where(and(eq(piecePracticeGoals.pieceId, pieceId), eq(piecePracticeGoals.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function buildComparisonCoachContext(
  pieceId: string,
  userId: string,
  currentLogId: string
): Promise<ComparisonCoachContext | null> {
  const data = await getPieceForUser(pieceId, userId);
  if (!data) return null;

  const goals = await getPracticeGoals(pieceId, userId);
  if (!goalsAreConfigured(goals)) return null;

  const clipped = await getPriorClippedSessions(pieceId, userId, 2);
  if (clipped.length < 2) return null;

  const current = clipped.find((l) => l.id === currentLogId) ?? clipped[0];
  const previous = clipped.find((l) => l.id !== current.id) ?? clipped[1];

  if (!current.audioAnalysis || !previous.audioAnalysis) return null;

  return {
    piece: {
      title: data.piece.title,
      composer: data.piece.composer,
      instrument: data.piece.instrument,
      difficulty: data.piece.difficulty,
      repertoireStatus: data.piece.repertoireStatus,
      tags: data.tags.map((t) => t.displayName),
    },
    goals: {
      goalsText: goals!.goalsText,
      targetTempoBpm: goals!.targetTempoBpm,
      dynamicsNotes: goals!.dynamicsNotes,
      emotionNotes: goals!.emotionNotes,
      passageNotes: goals!.passageNotes,
    },
    previousSession: {
      createdAt: previous.createdAt,
      passageNotes: previous.passageNotes,
      analysisSummary: formatAnalysisSummary(previous.audioAnalysis),
      analysis: previous.audioAnalysis,
    },
    currentSession: {
      passageNotes: current.passageNotes,
      analysisSummary: formatAnalysisSummary(current.audioAnalysis),
      analysis: current.audioAnalysis,
    },
  };
}

export async function getPreviousClippedSession(pieceId: string, userId: string, excludeLogId: string) {
  const rows = await getPriorClippedSessions(pieceId, userId, 3);
  return rows.find((r) => r.id !== excludeLogId) ?? null;
}
