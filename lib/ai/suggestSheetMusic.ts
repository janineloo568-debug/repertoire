import OpenAI from "openai";
import { suggestionResponseSchema } from "@/lib/ai/schemas";
import type { LibraryContext } from "@/lib/queries/suggestion-context";

export async function fetchSuggestions(context: LibraryContext) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({ apiKey });
  const model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

  const userContent = [
    `Instruments represented in the user's library: ${context.instrumentsSummary}`,
    `Favorite vibes (from tags): ${context.favoriteVibes}`,
    `Top loved pieces (title / composer / instrument / difficulty 1-5 / tags / short note):`,
    ...context.lovedPieces.map((l) => `— ${l}`),
    `Titles already in library (avoid duplicates): ${context.ownedTitles.slice(0, 200).join(" | ")}`,
    `Respond with a JSON object only, matching this shape:`,
    `{ "suggestions": [ { "title": string, "composer": string | null, "difficulty_estimate": number 1-5, "why_match": string, "sheet_music_url": string (valid URL), "url_type": "known_sheet_source" | "search_fallback", "instrument_hint": string | null (optional, e.g. piano, guitar), "vibes": string[] (optional, 1-5 short labels like chill, cinematic, matching the user's tags) } ] }`,
    `Include 3 to 5 suggestions. Use reputable sources; if unsure, use search_fallback and a real search URL.`,
    `When possible, set instrument_hint and vibes from the library context so each suggestion shows clear badges.`,
  ].join("\n");

  const completion = await client.chat.completions.create({
    model,
    messages: [
      {
        role: "system",
        content:
          "You are a sheet music discovery assistant. Recommend pieces to learn next based on the user's library. Output JSON only, no markdown.",
      },
      { role: "user", content: userContent },
    ],
    response_format: { type: "json_object" },
  });

  const content = completion.choices[0]?.message?.content;
  if (!content) {
    throw new Error("Empty model response");
  }

  const parsed = suggestionResponseSchema.safeParse(JSON.parse(content));
  if (!parsed.success) {
    throw new Error(`Invalid model JSON: ${parsed.error.message}`);
  }

  return parsed.data;
}
