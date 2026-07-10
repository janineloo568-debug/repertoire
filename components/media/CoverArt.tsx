"use client";

import { useEffect, useState } from "react";
import { fetchArtworkUrlFromItunes } from "@/lib/artwork/itunes";
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
 * Album artwork via iTunes Search — resolved in the browser (same path library tiles use).
 */
export function CoverArt({ title, composer, containerClassName, imgClassName }: CoverArtProps) {
  const [url, setUrl] = useState<string | null | undefined>(undefined);
  const [broken, setBroken] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setBroken(false);
    setUrl(undefined);

    fetchArtworkUrlFromItunes(title, composer)
      .then((resolved) => {
        if (!cancelled) setUrl(resolved);
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

  if (!url || broken) {
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
        onError={() => setBroken(true)}
      />
    </div>
  );
}
