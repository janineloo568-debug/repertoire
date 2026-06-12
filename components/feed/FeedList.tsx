import Link from "next/link";
import type { FeedItem } from "@/lib/queries/feed";
import { getActivityMeta, avatarInitials } from "@/lib/feed/activity-meta";
import { displayName } from "@/lib/feed/copy";
import { formatRelativeTime } from "@/lib/format/relative-time";
import { formatInstrumentLabel } from "@/lib/utils/instrument";
import { FeedSaveButton } from "@/components/feed/FeedSaveButton";

const accentBar: Record<FeedItem["type"], string> = {
  piece_added: "bg-emerald-500",
  piece_mastered: "bg-violet-500",
  public_note: "bg-amber-500",
  tag_added: "bg-sky-500",
};

export function FeedList({ items }: { items: FeedItem[] }) {
  if (items.length === 0) return null;

  return (
    <ul className="space-y-4">
      {items.map((item) => {
        const meta = getActivityMeta(item.type);
        const { Icon } = meta;
        const name = displayName(item.actor);
        const initials = avatarInitials(name);
        const pieceHref = `/u/${item.actor.username}/piece/${item.piece.id}`;
        const profileHref = `/u/${item.actor.username}`;

        return (
          <li key={item.id}>
            <article className="flex overflow-hidden rounded-xl border border-sheet-border bg-white shadow-sm transition-shadow hover:shadow-md">
              <div
                className={`w-1 shrink-0 ${accentBar[item.type]}`}
                aria-hidden
              />

              <div className="min-w-0 flex-1 px-4 py-4 sm:px-5 sm:py-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                  <Link
                    href={profileHref}
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-opacity hover:opacity-90 ${meta.avatarBg}`}
                    aria-label={`${name}'s profile`}
                  >
                    {initials}
                  </Link>
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-2 gap-y-1">
                    <Link
                      href={profileHref}
                      className="text-sm font-medium text-sheet-ink underline-offset-2 hover:underline"
                    >
                      {name}
                    </Link>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${meta.badge}`}
                    >
                      <Icon className="h-3 w-3 shrink-0" strokeWidth={2.25} aria-hidden />
                      {meta.label}
                    </span>
                  </div>
                  <span className="text-xs text-sheet-muted">
                    {formatRelativeTime(item.createdAt)}
                  </span>
                </div>

                <p className="mt-2 text-sm text-sheet-muted">
                  {item.type === "piece_mastered" && <span>Finished learning </span>}
                  {item.type === "piece_added" && <span>Added </span>}
                  {item.type === "public_note" && <span>Wrote about </span>}
                  {item.type === "tag_added" && <span>Tagged </span>}
                </p>

                <Link href={pieceHref} className="group mt-2 block">
                  <h2 className="font-display text-xl font-normal leading-snug text-sheet-ink transition-colors group-hover:text-black sm:text-2xl">
                    {item.piece.title}
                  </h2>
                  {item.piece.composer ? (
                    <p className="mt-0.5 text-sm text-sheet-muted">{item.piece.composer}</p>
                  ) : null}
                </Link>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-md border border-sheet-border/80 bg-sheet-cream/90 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-sheet-muted">
                    {formatInstrumentLabel(item.piece.instrument)}
                  </span>
                  {item.tag ? (
                    <span className="rounded-full border border-sheet-border bg-sheet-cream px-2.5 py-0.5 text-xs font-medium text-sheet-ink">
                      {item.tag.displayName}
                    </span>
                  ) : null}
                </div>

                {item.type === "public_note" && item.noteExcerpt ? (
                  <blockquote className="mt-3 rounded-lg border border-sheet-border/60 bg-sheet-cream/50 px-3 py-2.5 text-sm italic leading-relaxed text-sheet-ink">
                    &ldquo;{item.noteExcerpt}&rdquo;
                  </blockquote>
                ) : null}

                <div className="mt-3 border-t border-sheet-border/50 pt-3">
                  <FeedSaveButton pieceId={item.piece.id} />
                </div>
              </div>
            </article>
          </li>
        );
      })}
    </ul>
  );
}
