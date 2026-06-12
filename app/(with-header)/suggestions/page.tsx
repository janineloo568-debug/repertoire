import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { RegenerateButton } from "@/components/suggestions/RegenerateButton";
import { SuggestionCard } from "@/components/suggestions/SuggestionCard";
import { getLatestSuggestionsDisplay } from "@/lib/queries/suggestions-list";

export const dynamic = "force-dynamic";

export default async function SuggestionsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const latest = await getLatestSuggestionsDisplay(session.user.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-normal tracking-tight text-sheet-ink">Suggestions</h1>
          <p className="mt-2 text-sm leading-relaxed text-sheet-muted">
            Based on what you love, Repertoire suggests new pieces you&apos;d want to learn. No more waiting to hear
            something on TikTok.
          </p>
          {!latest?.batch && (
            <p className="mt-2 text-sm text-sheet-muted">No suggestions yet — generate a batch to get started.</p>
          )}
        </div>
        <RegenerateButton />
      </div>

      <div className="space-y-6">
        {latest?.suggestions.map((s) => (
          <SuggestionCard
            key={s.id}
            id={s.id}
            title={s.title}
            composer={s.composer}
            difficultyEstimate={s.difficultyEstimate}
            whyBlurb={s.whyBlurb}
            findSheetMusicUrl={s.findSheetMusicUrl}
            addedPieceId={s.addedPieceId}
            instrumentHint={s.instrumentHint}
            vibeHints={s.vibeHints}
          />
        ))}
      </div>
    </div>
  );
}
