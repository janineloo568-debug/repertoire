"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { CoverArt } from "@/components/media/CoverArt";
import type { listPiecesForUser } from "@/lib/queries/pieces";

type Row = Awaited<ReturnType<typeof listPiecesForUser>>[number];

export function PieceTileGrid({ rows }: { rows: Row[] }) {
  if (rows.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-sheet-border bg-white p-12 text-center text-sheet-muted">
        No pieces match your filters. Try adjusting search or add a new piece.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {rows.map((r) => (
        <Link
          key={r.id}
          href={`/library/${r.id}`}
          className="group flex flex-col overflow-hidden rounded-lg border border-sheet-border bg-white shadow-sm transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sheet-accent/40 focus-visible:ring-offset-2"
        >
          <CoverArt
            title={r.title}
            composer={r.composer}
            containerClassName="aspect-square w-full shrink-0 rounded-t-lg border-b border-sheet-border"
          />
          <div className="flex flex-1 flex-col gap-3 p-4">
            <div className="min-w-0 space-y-1">
              <h2 className="font-display text-lg font-normal leading-snug tracking-tight text-sheet-ink group-hover:text-sheet-accent">
                <span className="line-clamp-2">{r.title}</span>
              </h2>
              <p className="line-clamp-2 text-sm text-sheet-muted">{r.composer ?? "Unknown composer"}</p>
            </div>
            <Badge variant="instrument" className="w-fit capitalize">
              {r.instrument}
            </Badge>
            <div className="mt-auto flex items-center justify-between gap-2 border-t border-sheet-border/70 pt-3 text-xs text-sheet-muted">
              <span className="inline-flex items-center gap-1 font-medium tabular-nums text-sheet-ink">
                <span aria-hidden className="text-amber-600">
                  ★
                </span>
                {r.overallRating ?? "—"}
              </span>
              <time dateTime={new Date(r.dateAdded).toISOString()} className="tabular-nums">
                Added {new Date(r.dateAdded).toLocaleDateString()}
              </time>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
