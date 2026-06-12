import { z } from "zod";

export const suggestionItemSchema = z.object({
  title: z.string().min(1),
  composer: z.string().nullable(),
  difficulty_estimate: z.number().int().min(1).max(5),
  why_match: z.string().max(600),
  sheet_music_url: z.string().url(),
  url_type: z.enum(["known_sheet_source", "search_fallback"]),
  /** Human-readable instrument for badges (optional). */
  instrument_hint: z.string().max(64).nullable().optional(),
  /** Short vibe labels for badges (optional, max 5). */
  vibes: z.array(z.string().max(48)).max(5).optional(),
});

export const suggestionResponseSchema = z.object({
  suggestions: z.array(suggestionItemSchema).min(3).max(5),
});

export type SuggestionItemParsed = z.infer<typeof suggestionItemSchema>;

export const practiceCoachResponseSchema = z.object({
  coach_feedback: z.string().min(1).max(800),
  tomorrow_focus: z.string().min(1).max(200),
  action_steps: z.array(z.string().min(1).max(200)).min(2).max(3),
  encouragement_nugget: z.string().min(1).max(160),
});

export type PracticeCoachResponseParsed = z.infer<typeof practiceCoachResponseSchema>;

const DEFAULT_ENCOURAGEMENT = "Keep going — steady practice pays off.";

/** Coerce common model mistakes (extra steps, missing nugget) before validation. */
function normalizeCoachResponse(raw: unknown): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const o = raw as Record<string, unknown>;

  let steps: string[] = [];
  if (Array.isArray(o.action_steps)) {
    steps = o.action_steps
      .filter((s): s is string => typeof s === "string")
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (steps.length > 3) steps = steps.slice(0, 3);
  while (steps.length < 2) {
    steps.push(
      steps.length === 0
        ? "Play the passage slowly with a metronome, focusing on even timing."
        : "Repeat at a comfortable tempo until it feels steady."
    );
  }

  const nuggetSource = [o.encouragement_nugget, o.encouragement, o.encouragementNugget].find(
    (v) => typeof v === "string" && v.trim()
  );
  const encouragement_nugget =
    typeof nuggetSource === "string" ? nuggetSource.trim().slice(0, 160) : DEFAULT_ENCOURAGEMENT;

  return {
    coach_feedback: o.coach_feedback,
    tomorrow_focus: o.tomorrow_focus,
    action_steps: steps,
    encouragement_nugget,
  };
}

export function parsePracticeCoachResponse(raw: unknown): PracticeCoachResponseParsed {
  const parsed = practiceCoachResponseSchema.safeParse(normalizeCoachResponse(raw));
  if (!parsed.success) {
    throw new Error(`Invalid model JSON: ${parsed.error.message}`);
  }
  return parsed.data;
}

export const parsedPracticeGoalsSchema = z.object({
  target_tempo_bpm: z.number().int().min(20).max(300).nullable(),
  passage_notes: z.string().max(500),
  dynamics_notes: z.string().max(500),
  emotion_notes: z.string().max(500),
});

export type ParsedPracticeGoals = z.infer<typeof parsedPracticeGoalsSchema>;
