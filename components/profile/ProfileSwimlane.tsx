"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Children,
  isValidElement,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

const SCROLL_STEP_RATIO = 0.85;

export function ProfileSwimlane({
  children,
  className,
  "aria-label": ariaLabel = "Scroll pieces",
}: {
  children: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const laneChildren = useMemo(() => {
    const items = Children.toArray(children);
    const seenKeys = new Set<string>();
    return items.filter((child) => {
      if (!isValidElement(child)) return true;
      const key = String(child.key ?? "");
      if (!key || seenKeys.has(key)) return false;
      seenKeys.add(key);
      return true;
    });
  }, [children]);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const maxScroll = scrollWidth - clientWidth;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft < maxScroll - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener("scroll", updateScrollState, { passive: true });
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      ro.disconnect();
    };
  }, [updateScrollState, laneChildren]);

  function scrollByDirection(dir: -1 | 1) {
    const el = scrollRef.current;
    if (!el) return;
    const step = el.clientWidth * SCROLL_STEP_RATIO;
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  const showControls = canScrollLeft || canScrollRight;

  return (
    <div className={cn("relative", className)}>
      {showControls && canScrollLeft ? (
        <button
          type="button"
          onClick={() => scrollByDirection(-1)}
          className="absolute left-1 top-[40%] z-10 -translate-y-1/2 rounded-full border border-sheet-border bg-white/95 p-1.5 text-sheet-ink shadow-md backdrop-blur-sm transition hover:bg-white hover:shadow-lg sm:left-0 sm:-translate-x-1/2 sm:p-2"
          aria-label={`${ariaLabel} left`}
        >
          <ChevronLeft className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
        </button>
      ) : null}
      {showControls && canScrollRight ? (
        <button
          type="button"
          onClick={() => scrollByDirection(1)}
          className="absolute right-1 top-[40%] z-10 -translate-y-1/2 rounded-full border border-sheet-border bg-white/95 p-1.5 text-sheet-ink shadow-md backdrop-blur-sm transition hover:bg-white hover:shadow-lg sm:right-0 sm:translate-x-1/2 sm:p-2"
          aria-label={`${ariaLabel} right`}
        >
          <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5" strokeWidth={2} />
        </button>
      ) : null}

      <div
        ref={scrollRef}
        className={cn(
          "flex gap-4 overflow-x-auto overscroll-x-contain scroll-smooth pb-2 pt-1",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          "snap-x snap-mandatory"
        )}
        role="region"
        aria-label={ariaLabel}
      >
        {laneChildren}
      </div>

      {showControls && canScrollRight ? (
        <p className="mt-2 text-center text-xs text-sheet-muted">
          Swipe or use arrows to see more
        </p>
      ) : null}
    </div>
  );
}

export function ProfileSwimlaneCard({ children }: { children: ReactNode }) {
  return (
    <div className="w-[min(17.5rem,78vw)] shrink-0 snap-start sm:w-[280px]">{children}</div>
  );
}
