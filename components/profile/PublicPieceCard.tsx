import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CoverArt } from "@/components/media/CoverArt";
import { WantToLearnButton } from "@/components/profile/WantToLearnButton";
import type { ShelfSection } from "@/lib/profile/section-theme";
import { sectionTheme } from "@/lib/profile/section-theme";
import type { PublicPieceRow } from "@/lib/queries/public-profile";
import { instrumentChipLabel } from "@/lib/utils/instrument-emoji";
import { cn } from "@/lib/utils";

function StarRating({ value }: { value: number }) {
  return (
    <span className="text-amber-600" aria-label={`${value} out of 5 stars`}>
      {"★".repeat(value)}
      <span className="text-amber-200">{"★".repeat(5 - value)}</span>
    </span>
  );
}

export function PublicPieceCard({
  piece,
  username,
  section,
  className,
}: {
  piece: PublicPieceRow;
  username: string;
  section: ShelfSection;
  className?: string;
}) {
  const theme = sectionTheme[section];

  return (
    <article
      className={cn(
        "group flex h-full min-h-[22rem] flex-col overflow-hidden rounded-xl border border-sheet-border bg-white shadow-sm transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md",
        "border-l-4",
        theme.border,
        className
      )}
    >
      <Link href={`/u/${username}/piece/${piece.id}`} className="flex flex-1 flex-col">
        <CoverArt
          title={piece.title}
          composer={piece.composer}
          containerClassName="aspect-[4/3] w-full shrink-0 border-b border-sheet-border"
        />
        <div className="flex flex-1 flex-col gap-2 bg-gradient-to-b p-4 to-white">
          <div className="min-w-0">
            <h3 className="font-display text-lg font-normal leading-snug tracking-tight text-sheet-ink group-hover:text-sheet-accent">
              <span className="line-clamp-2">{piece.title}</span>
            </h3>
            {piece.composer ? (
              <p className="mt-0.5 line-clamp-1 text-sm text-sheet-muted">{piece.composer}</p>
            ) : null}
          </div>
          <Badge variant="instrument" className="w-fit">
            {instrumentChipLabel(piece.instrument)}
          </Badge>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-sheet-muted">
            {piece.overallRating != null ? (
              <span className="flex items-center gap-1 font-medium text-sheet-ink">
                <StarRating value={piece.overallRating} />
              </span>
            ) : null}
            <span>📊 {piece.difficulty}/5</span>
            {piece.difficultyUser != null ? <span>💪 {piece.difficultyUser}/5</span> : null}
          </div>
          {piece.tags.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {piece.tags.map((t) => (
                <Badge key={t.id} variant="vibe">
                  {t.displayName}
                  {t.fitScore != null ? (
                    <span className="ml-1 font-normal opacity-80">{t.fitScore}/5</span>
                  ) : null}
                </Badge>
              ))}
            </div>
          ) : null}
          {piece.publicNote ? (
            <p className="line-clamp-2 text-sm leading-relaxed text-sheet-muted">
              {piece.publicNote}
            </p>
          ) : null}
        </div>
      </Link>
      <div className="border-t border-sheet-border/60 bg-sheet-cream/50 px-4 py-3">
        <WantToLearnButton pieceId={piece.id} className="w-full sm:w-auto" />
      </div>
    </article>
  );
}
