import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CoverArt } from "@/components/media/CoverArt";
import { WantToLearnButton } from "@/components/profile/WantToLearnButton";
import { sectionTheme } from "@/lib/profile/section-theme";
import type { PublicPieceRow } from "@/lib/queries/public-profile";
import { instrumentChipLabel } from "@/lib/utils/instrument-emoji";
import { cn } from "@/lib/utils";

export function PublicPieceDetail({
  piece,
  owner,
}: {
  piece: PublicPieceRow;
  owner: { username: string; name: string | null };
}) {
  const display = owner.name?.trim() || owner.username;
  const theme = sectionTheme[piece.repertoireStatus];

  return (
    <article>
      <Link
        href={`/u/${owner.username}`}
        className="inline-flex items-center gap-1 text-sm font-medium text-sheet-accent transition-colors hover:text-sheet-accent-hover"
      >
        <span aria-hidden>←</span> {display}&apos;s shelf
      </Link>

      <div className="mt-6 overflow-hidden rounded-2xl border border-sheet-border bg-white shadow-md">
        <CoverArt
          title={piece.title}
          composer={piece.composer}
          containerClassName="aspect-[16/9] w-full max-h-72 border-b border-sheet-border sm:max-h-80"
        />
        <div
          className={cn(
            "border-b border-sheet-border bg-gradient-to-r px-6 py-3",
            theme.gradient
          )}
        >
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm font-medium",
              theme.accentMuted
            )}
          >
            <span aria-hidden>{theme.emoji}</span>
            {theme.title}
          </span>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <h1 className="font-display text-3xl font-normal tracking-tight text-sheet-ink">
              {piece.title}
            </h1>
            {piece.composer ? (
              <p className="mt-1 text-lg text-sheet-muted">{piece.composer}</p>
            ) : null}
          </div>
          <Badge variant="instrument">{instrumentChipLabel(piece.instrument)}</Badge>
          <div className="flex flex-wrap gap-4 text-sm text-sheet-muted">
            <span>
              📊 Catalog {piece.difficulty}/5
            </span>
            {piece.difficultyUser != null ? (
              <span>💪 Felt {piece.difficultyUser}/5</span>
            ) : null}
            {piece.overallRating != null ? (
              <span className="font-medium text-amber-700">
                ★ {piece.overallRating}/5 overall
              </span>
            ) : null}
          </div>
          {piece.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {piece.tags.map((t) => (
                <Badge key={t.id} variant="vibe">
                  {t.displayName}
                  {t.fitScore != null ? (
                    <span className="ml-1 font-normal opacity-80">· {t.fitScore}/5 fit</span>
                  ) : null}
                </Badge>
              ))}
            </div>
          ) : null}
          {piece.publicNote ? (
            <section className="rounded-xl border border-amber-100 bg-amber-50/50 p-5">
              <h2 className="text-xs font-semibold uppercase tracking-wide text-amber-800/80">
                📝 Public note
              </h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-sheet-ink">
                {piece.publicNote}
              </p>
            </section>
          ) : null}
          <WantToLearnButton pieceId={piece.id} size="default" />
        </div>
      </div>
    </article>
  );
}
