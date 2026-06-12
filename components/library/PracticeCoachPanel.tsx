"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { PracticeCoachResponseParsed } from "@/lib/ai/schemas";

export function PracticeCoachPanel({
  coach,
  coachError,
  coachMessage,
}: {
  coach: PracticeCoachResponseParsed | null;
  coachError?: string | null;
  coachMessage?: string | null;
}) {
  if (coachMessage && !coach) {
    return (
      <div className="rounded-lg border border-sheet-accent/30 bg-sheet-cream/80 px-4 py-3 text-sm text-sheet-ink">
        {coachMessage}
      </div>
    );
  }

  if (coachError && !coach) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        Session saved. {coachError}
      </div>
    );
  }

  if (!coach) return null;

  return (
    <Card className="overflow-hidden border-sheet-accent/30 bg-gradient-to-br from-sheet-cream to-white">
      <CardHeader className="border-b border-sheet-border/60 bg-white/60 pb-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-sheet-accent">AI Practice Coach</p>
        <CardTitle className="text-xl">Your next steps</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5 pt-5">
        <p className="text-sm leading-relaxed text-sheet-ink">{coach.coach_feedback}</p>

        <div className="rounded-lg border border-sheet-accent/25 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-sheet-muted">Tomorrow&apos;s focus</p>
          <p className="mt-1 font-medium text-sheet-ink">{coach.tomorrow_focus}</p>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-sheet-muted">Action plan</p>
          <ol className="space-y-2">
            {coach.action_steps.map((step, i) => (
              <li
                key={i}
                className="flex gap-3 rounded-md border border-sheet-border bg-white px-3 py-2.5 text-sm text-sheet-ink"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sheet-accent text-xs font-semibold text-white">
                  {i + 1}
                </span>
                <span className="pt-0.5">{step}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="border-t border-sheet-border/60 pt-4 text-center text-sm italic text-sheet-muted">
          {coach.encouragement_nugget}
        </p>
      </CardContent>
    </Card>
  );
}
