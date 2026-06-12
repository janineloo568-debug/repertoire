import type { FeedItem } from "@/lib/queries/feed";
import {
  BookMarked,
  MessageSquareQuote,
  Sparkles,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export type ActivityMeta = {
  label: string;
  Icon: LucideIcon;
  accent: string;
  badge: string;
  avatarBg: string;
};

const meta: Record<FeedItem["type"], ActivityMeta> = {
  piece_added: {
    label: "Added to library",
    Icon: BookMarked,
    accent: "border-emerald-200 bg-emerald-50/80 text-emerald-900",
    badge: "bg-emerald-100 text-emerald-800",
    avatarBg: "bg-emerald-700 text-white",
  },
  piece_mastered: {
    label: "Moved to Mastered",
    Icon: Trophy,
    accent: "border-violet-200 bg-violet-50/80 text-violet-900",
    badge: "bg-violet-100 text-violet-800",
    avatarBg: "bg-violet-700 text-white",
  },
  public_note: {
    label: "Public note",
    Icon: MessageSquareQuote,
    accent: "border-amber-200 bg-amber-50/80 text-amber-950",
    badge: "bg-amber-100 text-amber-900",
    avatarBg: "bg-amber-800 text-white",
  },
  tag_added: {
    label: "Vibe tag",
    Icon: Sparkles,
    accent: "border-sky-200 bg-sky-50/80 text-sky-950",
    badge: "bg-sky-100 text-sky-900",
    avatarBg: "bg-sky-800 text-white",
  },
};

export function getActivityMeta(type: FeedItem["type"]) {
  return meta[type];
}

export function avatarInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}
