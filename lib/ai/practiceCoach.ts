import OpenAI from "openai";
import { practiceCoachResponseSchema } from "@/lib/ai/schemas";
import type { ComparisonCoachContext } from "@/lib/queries/practice-context";

const SYSTEM_PROMPT = `You are a supportive, concise studio teacher who understands busy adult schedules.
The musician uploads short practice clips (instrumental, no speech) and sets ideal tempo, dynamics, and emotional goals.
You receive measured audio features from two sessions — never claim to hear specific wrong notes.

Respond with strict JSON only — no markdown — using exactly these keys:
- coach_feedback: 2-3 warm sentences comparing progress from the earlier clip to the latest clip, anchored to their stated goals
- tomorrow_focus: the single primary micro-goal for the next practice (one clear sentence)
- action_steps: array of 2-3 specific exercises or tempo constraints (concrete, 15-30 min)
- encouragement_nugget: one short motivational line

Rules:
- Only cite tempo, steadiness, energy/dynamics, or consistency when supported by the metrics provided
- Compare session 1 vs session 2 explicitly when metrics differ
- Reference their target tempo, dynamics, and emotion goals
- If tempo is unclear in the metrics, say so — do not invent a BPM
- Honor limited practice time; be kind and practical`;

function formatSession(label: string, session: ComparisonCoachContext["currentSession"], date?: Date) {
  const a = session.analysis;
  return [
    `${label}${date ? ` (${date.toISOString().slice(0, 10)})` : ""}:`,
    `- Passage notes: ${session.passageNotes || "(none)"}`,
    `- Summary: ${session.analysisSummary}`,
    `- Duration: ${a.durationSec}s`,
    `- Estimated tempo: ${a.estimatedTempoBpm ?? "unclear"} bpm, stability: ${a.tempoStability}`,
    `- Dynamic range (approx): ${a.dynamicRangeDb} dB`,
    `- Average energy (RMS): ${a.averageRms}, peak: ${a.peakRms}`,
  ].join("\n");
}

function buildUserPrompt(context: ComparisonCoachContext) {
  const { piece, goals } = context;
  return [
    "Piece:",
    `- Title: ${piece.title}`,
    piece.composer ? `- Composer: ${piece.composer}` : null,
    `- Instrument: ${piece.instrument}`,
    `- Status: ${piece.repertoireStatus}`,
    piece.tags.length ? `- Tags: ${piece.tags.join(", ")}` : null,
    "",
    "Musician's ideal outcome:",
    goals.goalsText.trim()
      ? `- Original goals (full text): ${goals.goalsText.trim()}`
      : null,
    goals.targetTempoBpm ? `- Target tempo: ${goals.targetTempoBpm} bpm` : "- Target tempo: (not set)",
    goals.dynamicsNotes.trim()
      ? `- Dynamics goal: ${goals.dynamicsNotes.trim()}`
      : "- Dynamics goal: (not set)",
    goals.emotionNotes.trim()
      ? `- Emotional character: ${goals.emotionNotes.trim()}`
      : "- Emotional character: (not set)",
    goals.passageNotes.trim()
      ? `- Ideal passage to record each time: ${goals.passageNotes.trim()}`
      : null,
    "",
    formatSession("Earlier session", context.previousSession, context.previousSession.createdAt),
    "",
    formatSession("Latest session", context.currentSession),
    "",
    "Compare the two clips and coach them toward their ideal outcome.",
  ]
    .filter(Boolean)
    .join("\n");
}

export async function fetchComparisonPracticeCoach(context: ComparisonCoachContext) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const completion = await client.chat.completions.create({
    model,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: buildUserPrompt(context) },
    ],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty model response");
  }

  const parsed = practiceCoachResponseSchema.safeParse(JSON.parse(content));
  if (!parsed.success) {
    throw new Error(`Invalid model JSON: ${parsed.error.message}`);
  }

  return parsed.data;
}
