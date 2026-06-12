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

export const parsedPracticeGoalsSchema = z.object({
  target_tempo_bpm: z.number().int().min(20).max(300).nullable(),
  passage_notes: z.string().max(500),
  dynamics_notes: z.string().max(500),
  emotion_notes: z.string().max(500),
});

export type ParsedPracticeGoals = z.infer<typeof parsedPracticeGoalsSchema>;
