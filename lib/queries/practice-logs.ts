import type { PracticeCoachResponseParsed } from "@/lib/ai/schemas";
import type { AudioClipAnalysis } from "@/lib/db/schema";

export function serializePracticeLog(log: {
  id: string;
  body: string;
  passageNotes: string;
  audioStorageKey: string | null;
  audioMimeType: string | null;
  audioAnalysis: AudioClipAnalysis | null;
  coachResponse: PracticeCoachResponseParsed | null;
  createdAt: Date | number | string;
}) {
  const createdAt =
    log.createdAt instanceof Date
      ? log.createdAt
      : new Date(typeof log.createdAt === "number" ? log.createdAt : String(log.createdAt));

  return {
    id: log.id,
    body: log.body,
    passageNotes: log.passageNotes,
    hasAudio: !!log.audioStorageKey,
    audioAnalysis: log.audioAnalysis,
    coachResponse: log.coachResponse,
    createdAt: Number.isNaN(createdAt.getTime()) ? new Date().toISOString() : createdAt.toISOString(),
  };
}

export function goalsAreConfigured(goals: {
  goalsText?: string;
  targetTempoBpm: number | null;
  dynamicsNotes: string;
  emotionNotes: string;
  passageNotes?: string;
} | null) {
  if (!goals) return false;
  if (goals.goalsText?.trim()) return true;
  return !!(
    goals.targetTempoBpm ||
    goals.dynamicsNotes.trim() ||
    goals.emotionNotes.trim() ||
    goals.passageNotes?.trim()
  );
}

export function formatAnalysisSummary(analysis: AudioClipAnalysis) {
  const tempo = analysis.estimatedTempoBpm
    ? `${analysis.estimatedTempoBpm} bpm (${analysis.tempoStability})`
    : "tempo unclear";
  return `${analysis.durationSec}s · ${tempo} · dynamics range ~${analysis.dynamicRangeDb} dB`;
}
