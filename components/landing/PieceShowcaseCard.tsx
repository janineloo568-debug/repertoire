"use client";

import { CoverArt } from "@/components/media/CoverArt";
import { cn } from "@/lib/utils";
import type { ShowcaseStatusTone } from "@/lib/landing/showcasePieces";

const statusStyles: Record<ShowcaseStatusTone, string> = {
  mastered: "text-[#be99ff]",
  learning: "text-[#d78f31]",
  new: "text-[#99ffb9]",
};

export function PieceShowcaseCard({
  title,
  composer,
  statusLabel,
  statusTone,
  genreLabel,
  className,
}: {
  title: string;
  composer: string;
  statusLabel: string;
  statusTone: ShowcaseStatusTone;
  genreLabel: string;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "flex min-h-[205px] flex-col overflow-hidden rounded-lg border border-[#333] bg-[#1a1a1a] isolate",
        className
      )}
    >
      <div className="relative h-[121px] shrink-0 overflow-hidden">
        <CoverArt
          title={title}
          composer={composer}
          containerClassName="absolute inset-0 border-0 bg-[#2a2a2a]"
          imgClassName="h-full w-full object-cover brightness-75"
        />
        <div className="pointer-events-none absolute inset-0 z-[1] bg-black/35" aria-hidden />
        <div className="relative z-10 flex items-start justify-between gap-2 p-6">
          <span className="border border-[#333] bg-[#111] px-2 py-1 text-xs font-medium leading-none text-white">
            <span className={statusStyles[statusTone]}>{statusLabel}</span>
          </span>
          <span className="shrink-0 border border-[#d8d8d8] bg-white/80 px-2 py-1 text-xs leading-none text-black">
            {genreLabel}
          </span>
        </div>
      </div>
      <div className="relative z-[1] flex flex-col gap-1 border-t border-[#333] p-4">
        <h3 className="text-lg font-medium leading-7 text-white">{title}</h3>
        <p className="text-sm leading-5 text-[#a3a3a3]">{composer}</p>
      </div>
    </article>
  );
}
