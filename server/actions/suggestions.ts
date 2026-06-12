"use server";

import { APIError } from "openai";
import { and, desc, eq, gte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { buildOfflineSuggestions } from "@/lib/ai/suggestOffline";
import { fetchSuggestions } from "@/lib/ai/suggestSheetMusic";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { pieces, ratings, suggestionBatches, suggestions } from "@/lib/db/schema";
import { buildLibraryContext } from "@/lib/queries/suggestion-context";

export async function regenerateSuggestions(): Promise<
  | { ok: true; count: number; batchId: string }
  | { ok: false; error: string }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { ok: false, error: "You need to be signed in." };
  }

  const context = await buildLibraryContext(session.user.id);

  const sourceRows = await db
    .select({ id: pieces.id })
    .from(pieces)
    .innerJoin(ratings, and(eq(ratings.pieceId, pieces.id), eq(ratings.userId, session.user.id)))
    .where(and(eq(pieces.userId, session.user.id), gte(ratings.overall, 4)))
    .orderBy(desc(ratings.overall))
    .limit(15);

  const sourcePieceIds = sourceRows.map((r) => r.id);

  const apiKey = process.env.OPENAI_API_KEY?.trim();

  let result: Awaited<ReturnType<typeof fetchSuggestions>>;
  let model: string;
  let promptVersion: string;

  if (apiKey) {
    try {
      result = await fetchSuggestions(context);
      model = process.env.OPENAI_MODEL ?? "gpt-4o-mini";
      promptVersion = "v1-openai";
    } catch (e) {
      if (e instanceof APIError && e.status === 429) {
        result = buildOfflineSuggestions(context);
        model = "offline-imslp (quota fallback)";
        promptVersion = "v1-offline-fallback";
      } else if (e instanceof APIError) {
        return { ok: false, error: e.message || "OpenAI request failed" };
      } else {
        return { ok: false, error: e instanceof Error ? e.message : "Could not reach OpenAI." };
      }
    }
  } else {
    result = buildOfflineSuggestions(context);
    model = "offline-imslp";
    promptVersion = "v1-offline";
  }

  const [batch] = await db
    .insert(suggestionBatches)
    .values({
      userId: session.user.id,
      model,
      promptVersion,
    })
    .returning({ id: suggestionBatches.id });

  if (!batch) {
    throw new Error("Could not create suggestion batch");
  }

  for (const s of result.suggestions) {
    await db.insert(suggestions).values({
      batchId: batch.id,
      userId: session.user.id,
      title: s.title,
      composer: s.composer,
      difficultyEstimate: s.difficulty_estimate,
      whyBlurb: s.why_match,
      findSheetMusicUrl: s.sheet_music_url,
      urlType: s.url_type,
      instrumentHint: s.instrument_hint?.trim() || null,
      vibeHints: s.vibes && s.vibes.length > 0 ? s.vibes : null,
      sourcePieceIds,
    });
  }

  revalidatePath("/suggestions");
  return { ok: true, count: result.suggestions.length, batchId: batch.id };
}

export async function addSuggestionToLibrary(suggestionId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const rows = await db
    .select()
    .from(suggestions)
    .where(and(eq(suggestions.id, suggestionId), eq(suggestions.userId, session.user.id)))
    .limit(1);

  const sug = rows[0];
  if (!sug) return { error: "not_found" as const };

  const [piece] = await db
    .insert(pieces)
    .values({
      userId: session.user.id,
      title: sug.title,
      composer: sug.composer,
      instrument: "other",
      difficulty: sug.difficultyEstimate,
      sourceType: "external_link",
      externalUrl: sug.findSheetMusicUrl,
      storageKey: null,
    })
    .returning({ id: pieces.id });

  await db
    .update(suggestions)
    .set({ addedPieceId: piece?.id ?? null })
    .where(eq(suggestions.id, suggestionId));

  revalidatePath("/library");
  revalidatePath("/suggestions");
  return { pieceId: piece?.id };
}
