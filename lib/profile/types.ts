import type { PublicPieceRow } from "@/lib/queries/public-profile";

export type PublicProfileData = {
  user: {
    id: string;
    name: string | null;
    username: string;
    bio: string | null;
    instrumentsPlayed: string[];
    avatarUrl: string | null;
  };
  totalLibraryCount: number;
  publicPieceCount: number;
  vibeTags: { id: string; displayName: string }[];
  learning: PublicPieceRow[];
  mastered: PublicPieceRow[];
  saved: PublicPieceRow[];
};
