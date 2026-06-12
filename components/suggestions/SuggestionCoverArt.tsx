"use client";

import { CoverArt } from "@/components/media/CoverArt";

type Props = {
  title: string;
  composer: string | null;
};

/** Cover thumbnail for suggestion cards (shared iTunes lookup with library tiles). */
export function SuggestionCoverArt({ title, composer }: Props) {
  return (
    <CoverArt
      title={title}
      composer={composer}
      containerClassName="size-[4.5rem] shrink-0 rounded-md border border-sheet-border shadow-sm sm:size-20"
    />
  );
}
