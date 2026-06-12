"use client";

import { useMemo, useState } from "react";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";
import { ProfileSwimlane, ProfileSwimlaneCard } from "@/components/profile/ProfileSwimlane";
import { PublicPieceCard } from "@/components/profile/PublicPieceCard";
import { dedupePiecesInSwimlane } from "@/lib/profile/dedupe-pieces";
import type { PublicProfileData } from "@/lib/profile/types";
import type { ShelfSection } from "@/lib/profile/section-theme";
import { sectionTheme } from "@/lib/profile/section-theme";
import type { PublicPieceRow } from "@/lib/queries/public-profile";
import { instrumentChipLabel } from "@/lib/utils/instrument-emoji";
import { cn } from "@/lib/utils";

function filterPieces(pieces: PublicPieceRow[], tagId: string | null) {
  const lane = dedupePiecesInSwimlane(pieces);
  if (!tagId) return lane;
  return lane.filter((p) => p.tags.some((t) => t.id === tagId));
}

function Section({
  section,
  pieces,
  username,
}: {
  section: ShelfSection;
  pieces: PublicPieceRow[];
  username: string;
}) {
  const lanePieces = dedupePiecesInSwimlane(pieces);
  if (lanePieces.length === 0) return null;
  const theme = sectionTheme[section];

  return (
    <section className="mt-12">
      <div
        className={cn(
          "rounded-2xl border border-sheet-border bg-white/80 px-4 py-5 shadow-sm backdrop-blur-sm sm:px-5 sm:py-6",
          "bg-gradient-to-r",
          theme.gradient
        )}
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className={cn("font-display text-2xl font-normal", theme.accent)}>
              <span className="mr-2" aria-hidden>
                {theme.emoji}
              </span>
              {theme.title}
            </h2>
            <p className="mt-1 text-sm text-sheet-muted">{theme.subtitle}</p>
          </div>
          <span
            className={cn(
              "rounded-full border px-3 py-1 text-sm font-medium tabular-nums",
              theme.accentMuted
            )}
          >
            {lanePieces.length} {lanePieces.length === 1 ? "piece" : "pieces"}
          </span>
        </div>
        <div className="-mx-4 mt-5 sm:-mx-5">
          <ProfileSwimlane className="px-4 sm:px-5" aria-label={`${theme.title} pieces`}>
          {lanePieces.map((p) => (
            <ProfileSwimlaneCard key={`${section}-${p.id}`}>
              <PublicPieceCard piece={p} username={username} section={section} />
            </ProfileSwimlaneCard>
          ))}
          </ProfileSwimlane>
        </div>
      </div>
    </section>
  );
}

export function PublicProfileBrowser({ profile }: { profile: PublicProfileData }) {
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const { user } = profile;
  const display = user.name?.trim() || user.username;

  const learning = useMemo(
    () => filterPieces(profile.learning, activeTagId),
    [profile.learning, activeTagId]
  );
  const mastered = useMemo(
    () => filterPieces(profile.mastered, activeTagId),
    [profile.mastered, activeTagId]
  );
  const saved = useMemo(
    () => filterPieces(profile.saved, activeTagId),
    [profile.saved, activeTagId]
  );

  const filteredCount = learning.length + mastered.length + saved.length;
  const instruments = user.instrumentsPlayed ?? [];

  return (
    <div className="-mx-4 sm:mx-0">
      <header className="relative overflow-hidden rounded-2xl border border-sheet-border bg-gradient-to-br from-violet-100/90 via-sheet-cream to-amber-50/90 px-5 py-8 shadow-sm sm:px-8 sm:py-10">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-sheet-accent/10 blur-2xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-8 h-36 w-36 rounded-full bg-amber-300/20 blur-2xl"
          aria-hidden
        />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start">
          <ProfileAvatar
            name={display}
            username={user.username}
            avatarUrl={user.avatarUrl}
            size="xl"
          />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-sheet-accent">
              ✨ Public shelf
            </p>
            <h1 className="font-display mt-2 text-4xl font-normal tracking-tight text-sheet-ink sm:text-5xl">
              {display}
            </h1>
            <p className="mt-1 text-sm font-medium text-violet-700/80">@{user.username}</p>
            {user.bio ? (
              <p className="mt-4 max-w-xl whitespace-pre-wrap text-base leading-relaxed text-sheet-ink">
                {user.bio}
              </p>
            ) : null}
            {instruments.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {instruments.map((inst) => (
                  <span
                    key={inst}
                    className="inline-flex items-center rounded-full border border-violet-200/80 bg-white/90 px-3 py-1 text-sm font-medium text-sheet-ink shadow-sm"
                  >
                    {instrumentChipLabel(inst)}
                  </span>
                ))}
              </div>
            ) : null}
            <dl className="mt-6 flex flex-wrap gap-4">
              <div className="rounded-xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm">
                <dt className="text-xs font-medium uppercase tracking-wide text-sheet-muted">
                  📚 Library
                </dt>
                <dd className="mt-0.5 text-lg font-medium tabular-nums text-sheet-ink">
                  {profile.totalLibraryCount}
                </dd>
              </div>
              <div className="rounded-xl border border-white/60 bg-white/70 px-4 py-3 shadow-sm backdrop-blur-sm">
                <dt className="text-xs font-medium uppercase tracking-wide text-sheet-muted">
                  🌐 On shelf
                </dt>
                <dd className="mt-0.5 text-lg font-medium tabular-nums text-sheet-accent">
                  {profile.publicPieceCount}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </header>

      {profile.vibeTags.length > 0 ? (
        <div className="mt-10">
          <p className="text-xs font-semibold uppercase tracking-wide text-sheet-muted">
            🏷️ Browse by vibe
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveTagId(null)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                activeTagId === null
                  ? "border-sheet-accent bg-sheet-accent text-white shadow-sm"
                  : "border-sheet-border bg-white text-sheet-ink hover:border-sheet-accent/40"
              )}
            >
              All vibes
            </button>
            {profile.vibeTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setActiveTagId(tag.id)}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                  activeTagId === tag.id
                    ? "border-sheet-accent bg-sheet-accent/15 text-[#5b21b6] ring-2 ring-sheet-accent/30"
                    : "border-sheet-border bg-white text-sheet-ink hover:border-sheet-accent/30"
                )}
              >
                {tag.displayName}
              </button>
            ))}
          </div>
          {activeTagId && filteredCount === 0 ? (
            <p className="mt-4 text-sm text-sheet-muted">
              No public pieces with this vibe on their shelf.
            </p>
          ) : null}
        </div>
      ) : null}

      <Section section="learning" pieces={learning} username={user.username} />
      <Section section="mastered" pieces={mastered} username={user.username} />
      <Section section="saved" pieces={saved} username={user.username} />

      {profile.publicPieceCount === 0 ? (
        <p className="mt-16 rounded-xl border border-dashed border-sheet-border bg-white/60 p-12 text-center text-sm text-sheet-muted">
          Nothing on this shelf yet — check back when they share pieces. 📭
        </p>
      ) : null}
    </div>
  );
}
