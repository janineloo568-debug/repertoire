import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { suggestionBatches, suggestions } from "@/lib/db/schema";
import { enrichSuggestionForDisplay } from "@/lib/suggestions/enrichDisplay";
import { buildLibraryContext } from "@/lib/queries/suggestion-context";

export async function getLatestSuggestionsDisplay(userId: string) {
  const batch = await db
    .select()
    .from(suggestionBatches)
    .where(eq(suggestionBatches.userId, userId))
    .orderBy(desc(suggestionBatches.createdAt))
    .limit(1);

  const b = batch[0];
  if (!b) return null;

  const rows = await db
    .select()
    .from(suggestions)
    .where(and(eq(suggestions.batchId, b.id), isNull(suggestions.dismissedAt)))
    .orderBy(suggestions.title);

  const ctx = await buildLibraryContext(userId);
  const suggestionsEnriched = rows.map((r) => enrichSuggestionForDisplay(r, ctx));

  return { batch: b, suggestions: suggestionsEnriched };
}
