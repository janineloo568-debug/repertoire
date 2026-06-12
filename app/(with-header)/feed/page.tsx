import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { FeedEmptyState } from "@/components/feed/FeedEmptyState";
import { FeedList } from "@/components/feed/FeedList";
import { listFeedForUser, listSuggestedProfiles } from "@/lib/queries/feed";
import { isPrototypeMockEnabled } from "@/lib/prototype/config";
import { MOCK_FEED_ITEMS, listMockSuggestedProfiles } from "@/lib/prototype/mock-data";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const prototype = isPrototypeMockEnabled();

  let realItems: Awaited<ReturnType<typeof listFeedForUser>> = [];
  let realSuggestions: Awaited<ReturnType<typeof listSuggestedProfiles>> = [];
  if (!prototype) {
    [realItems, realSuggestions] = await Promise.all([
      listFeedForUser(session.user.id),
      listSuggestedProfiles(session.user.id),
    ]);
  }

  const items = prototype ? MOCK_FEED_ITEMS : realItems;
  const suggestions = prototype ? listMockSuggestedProfiles() : realSuggestions;

  return (
    <div className="mx-auto max-w-2xl px-3 py-8 sm:px-4">
      <header className="mb-10">
        <h1 className="font-display text-3xl font-normal tracking-tight text-sheet-ink">Feed</h1>
        <p className="mt-2 text-sm leading-relaxed text-sheet-muted">
          Recent updates from musicians you follow — newest first, nothing else.
        </p>
      </header>

      {items.length > 0 ? (
        <FeedList items={items} />
      ) : (
        <FeedEmptyState suggestions={suggestions} />
      )}

      {prototype && suggestions.length > 0 ? (
        <div className="mt-12 border-t border-sheet-border pt-8">
          <p className="text-xs font-medium uppercase tracking-wide text-sheet-muted">
            Musicians to explore
          </p>
          <ul className="mt-3 space-y-2">
            {suggestions.map((s) => (
              <li key={s.username}>
                <Link
                  href={`/u/${s.username}`}
                  className="text-sm font-medium text-sheet-ink hover:underline"
                >
                  {s.name} <span className="font-normal text-sheet-muted">@{s.username}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!prototype && items.length > 0 && suggestions.length > 0 ? (
        <p className="mt-12 text-center text-sm text-sheet-muted">
          Discover more at{" "}
          <Link href={`/u/${suggestions[0]!.username}`} className="text-sheet-ink hover:underline">
            @{suggestions[0]!.username}
          </Link>
        </p>
      ) : null}
    </div>
  );
}
