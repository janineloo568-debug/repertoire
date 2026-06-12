import OpenAI from "openai";
import { parsedPracticeGoalsSchema, type ParsedPracticeGoals } from "@/lib/ai/schemas";

const SYSTEM_PROMPT = `You extract structured practice goals from a musician's free-form notes.
The user writes one paragraph or bullet list describing what they want from this piece.

Return strict JSON only with these keys:
- target_tempo_bpm: integer 20-300 or null if not mentioned
- passage_notes: short string — which section to record each session (e.g. "Bars 12–24, hands together"), or "" if unclear
- dynamics_notes: short string — dynamic shape and constraints, or "" if unclear
- emotion_notes: short string — mood, character, feeling, or "" if unclear

Use the musician's words where possible. Do not invent tempo or details they did not imply.`;

function parsePracticeGoalsOffline(goalsText: string): ParsedPracticeGoals {
  const trimmed = goalsText.trim();
  if (!trimmed) {
    return {
      target_tempo_bpm: null,
      passage_notes: "",
      dynamics_notes: "",
      emotion_notes: "",
    };
  }

  let target_tempo_bpm: number | null = null;
  const bpmMatch =
    trimmed.match(/\b(\d{2,3})\s*bpm\b/i) ||
    trimmed.match(/tempo[:\s]+(\d{2,3})\b/i) ||
    trimmed.match(/\bat\s+(\d{2,3})\b/i);
  if (bpmMatch) {
    const n = Number(bpmMatch[1]);
    if (n >= 20 && n <= 300) target_tempo_bpm = n;
  }

  const lines = trimmed
    .split(/\n+/)
    .map((l) => l.replace(/^[\s]*[-•*]\s*/, "").trim())
    .filter(Boolean);

  const passageLine =
    lines.find((l) => /\b(bars?|measures?|m\.\s*\d|passage|section|exposition|verse|chorus)\b/i.test(l)) ??
    trimmed.match(/(?:bars?\s+[\d–—-]+[^\n.]*|measures?\s+[\d–—-]+[^\n.]*)/i)?.[0]?.trim() ??
    "";

  const dynamicsLine =
    lines.find((l) =>
      /\b(dynamic|crescendo|diminuendo|pianissimo|fortissimo|mf|mp|pp|ff|soft|loud|accent|subito)\b/i.test(l)
    ) ?? "";

  const emotionLine =
    lines.find((l) =>
      /\b(feel|mood|character|emotion|warm|tender|bright|dark|unhurried|lyrical|expressive|intimate|playful)\b/i.test(
        l
      )
    ) ?? "";

  const used = new Set([passageLine, dynamicsLine, emotionLine].filter(Boolean));
  const remainder = lines.filter((l) => !used.has(l) && !/^\d{2,3}\s*bpm$/i.test(l)).join(" ");

  return {
    target_tempo_bpm,
    passage_notes: passageLine.slice(0, 500),
    dynamics_notes: (dynamicsLine || "").slice(0, 500),
    emotion_notes: (emotionLine || remainder || trimmed).slice(0, 500),
  };
}

export async function parsePracticeGoals(
  goalsText: string,
  piece?: { title: string; instrument: string }
): Promise<ParsedPracticeGoals> {
  const trimmed = goalsText.trim();
  if (!trimmed) {
    return {
      target_tempo_bpm: null,
      passage_notes: "",
      dynamics_notes: "",
      emotion_notes: "",
    };
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return parsePracticeGoalsOffline(trimmed);
  }

  try {
    const client = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

    const userContent = [
      piece ? `Piece: ${piece.title} (${piece.instrument})` : null,
      "Musician's practice goals:",
      trimmed,
    ]
      .filter(Boolean)
      .join("\n");

    const completion = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      return parsePracticeGoalsOffline(trimmed);
    }

    const parsed = parsedPracticeGoalsSchema.safeParse(JSON.parse(content));
    if (!parsed.success) {
      return parsePracticeGoalsOffline(trimmed);
    }

    return parsed.data;
  } catch {
    return parsePracticeGoalsOffline(trimmed);
  }
}

export function parsedGoalsToStored(parsed: ParsedPracticeGoals) {
  return {
    targetTempoBpm: parsed.target_tempo_bpm,
    passageNotes: parsed.passage_notes.trim(),
    dynamicsNotes: parsed.dynamics_notes.trim(),
    emotionNotes: parsed.emotion_notes.trim(),
  };
}
