import Link from "next/link";

export function FeedEmptyState({
  suggestions,
}: {
  suggestions: { username: string; name: string | null; publicPieceCount: number }[];
}) {
  return (
    <div className="rounded-lg border border-dashed border-sheet-border bg-white/60 px-6 py-10 text-center">
      <p className="font-display text-lg text-sheet-ink">Your feed is quiet</p>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-sheet-muted">
        Follow musicians with public profiles to see what they&apos;re learning, mastering, and
        noting — in chronological order, no noise.
      </p>
      {suggestions.length > 0 ? (
        <div className="mt-8 text-left">
          <p className="text-xs font-medium uppercase tracking-wide text-sheet-muted">
            Browse public shelves
          </p>
          <ul className="mt-3 space-y-2">
            {suggestions.map((s) => (
              <li key={s.username}>
                <Link
                  href={`/u/${s.username}`}
                  className="flex items-baseline justify-between gap-4 rounded-md px-2 py-2 text-sm transition-colors hover:bg-sheet-cream"
                >
                  <span className="font-medium text-sheet-ink">
                    {s.name?.trim() || s.username}
                    <span className="ml-2 font-normal text-sheet-muted">@{s.username}</span>
                  </span>
                  <span className="shrink-0 text-xs text-sheet-muted">
                    {s.publicPieceCount} public
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="mt-6 text-sm text-sheet-muted">
          Set a username in Settings and mark pieces public to appear here for others.
        </p>
      )}
    </div>
  );
}
