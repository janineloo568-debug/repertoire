"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { SuggestionCoverArt } from "@/components/suggestions/SuggestionCoverArt";
import { addSuggestionToLibrary } from "@/server/actions/suggestions";

export function SuggestionCard({
  id,
  title,
  composer,
  difficultyEstimate,
  whyBlurb,
  findSheetMusicUrl,
  addedPieceId,
  instrumentHint,
  vibeHints,
}: {
  id: string;
  title: string;
  composer: string | null;
  difficultyEstimate: number;
  whyBlurb: string;
  findSheetMusicUrl: string;
  addedPieceId: string | null;
  instrumentHint?: string | null;
  vibeHints?: string[] | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function save() {
    setPending(true);
    await addSuggestionToLibrary(id);
    setPending(false);
    router.refresh();
  }

  const vibes = vibeHints?.filter(Boolean) ?? [];

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex gap-4">
          <SuggestionCoverArt title={title} composer={composer} />
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex flex-wrap items-start justify-between gap-2 gap-y-1">
              <CardTitle className="text-xl leading-tight">{title}</CardTitle>
              <Badge variant="outline" className="shrink-0">
                Difficulty ~{difficultyEstimate}
              </Badge>
            </div>
            <CardDescription>{composer ?? "Composer unknown"}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {(instrumentHint || vibes.length > 0) ? (
          <div className="flex flex-wrap items-center gap-2">
            {instrumentHint ? (
              <Badge variant="instrument" className="capitalize">
                {instrumentHint}
              </Badge>
            ) : null}
            {vibes.map((v) => (
              <Badge key={v} variant="vibe">
                {v}
              </Badge>
            ))}
          </div>
        ) : null}
        <p className="text-sm leading-relaxed text-sheet-muted">{whyBlurb}</p>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
          <a
            href={findSheetMusicUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-sheet-accent underline hover:text-sheet-accent-hover"
          >
            Find sheet music
          </a>
        </div>
      </CardContent>
      <CardFooter>
        {addedPieceId ? (
          <p className="text-sm text-green-700">Added to library.</p>
        ) : (
          <Button type="button" size="sm" onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save link to library"}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
