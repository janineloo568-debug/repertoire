import type { PublicPieceRow } from "@/lib/queries/public-profile";

export type ShelfSection = PublicPieceRow["repertoireStatus"];

export const sectionTheme: Record<
  ShelfSection,
  {
    emoji: string;
    title: string;
    subtitle: string;
    accent: string;
    accentMuted: string;
    border: string;
    gradient: string;
  }
> = {
  learning: {
    emoji: "📖",
    title: "Currently learning",
    subtitle: "Pieces they're working on now",
    accent: "text-amber-700",
    accentMuted: "bg-amber-50 text-amber-900 border-amber-200",
    border: "border-l-amber-400",
    gradient: "from-amber-500/15 via-transparent to-transparent",
  },
  mastered: {
    emoji: "🏆",
    title: "Mastered",
    subtitle: "Pieces they've brought to performance level",
    accent: "text-emerald-700",
    accentMuted: "bg-emerald-50 text-emerald-900 border-emerald-200",
    border: "border-l-emerald-500",
    gradient: "from-emerald-500/15 via-transparent to-transparent",
  },
  saved: {
    emoji: "🔖",
    title: "Saved for later",
    subtitle: "Pieces tucked away for a specific situation",
    accent: "text-sky-700",
    accentMuted: "bg-sky-50 text-sky-900 border-sky-200",
    border: "border-l-sky-500",
    gradient: "from-sky-500/15 via-transparent to-transparent",
  },
};

export function profileAvatarUrl(username: string, hasAvatar: boolean): string | null {
  return hasAvatar ? `/api/users/${username}/avatar` : null;
}
