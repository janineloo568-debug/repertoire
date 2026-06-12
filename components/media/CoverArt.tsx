"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type CoverArtProps = {
  title: string;
  composer: string | null;
  /** Wrapper around the image area (loading, placeholder, or crop frame). */
  containerClassName?: string;
  /** Extra classes on the `<img>` when loaded. */
  imgClassName?: string;
};

/**
 * Album / single artwork from iTunes Search via `/api/suggestions/artwork`.
 */
export function CoverArt({ title, composer, containerClassName, imgClassName }: CoverArtProps) {
  const [url, setUrl] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    const params = new URLSearchParams({ title });
    if (composer?.trim()) params.set("composer", composer.trim());

    fetch(`/api/suggestions/artwork?${params.toString()}`)
      .then((r) => r.json() as Promise<{ url: string | null }>)
      .then((d) => {
        if (!cancelled) setUrl(d.url ?? null);
      })
      .catch(() => {
        if (!cancelled) setUrl(null);
      });

    return () => {
      cancelled = true;
    };
  }, [title, composer]);

  const alt =
    composer?.trim() != null && composer.trim() !== ""
      ? `Album artwork for “${title}” by ${composer.trim()}`
      : `Album artwork for “${title}”`;

  if (url === undefined) {
    return (
      <div
        className={cn(
          "animate-pulse border border-sheet-border bg-sheet-cream",
          containerClassName
        )}
        aria-hidden
      />
    );
  }

  if (!url) {
    return (
      <div
        className={cn(
          "flex items-center justify-center border border-sheet-border bg-sheet-cream text-xl text-sheet-muted",
          containerClassName
        )}
        aria-hidden
      >
        ♪
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-sheet-cream", containerClassName)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- remote iTunes CDN hostnames vary */}
      <img
        src={url}
        alt={alt}
        className={cn("h-full w-full object-cover", imgClassName)}
        loading="lazy"
      />
    </div>
  );
}
