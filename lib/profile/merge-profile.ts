import type { PublicProfileData } from "@/lib/profile/types";
import { collectProfileVibeTags } from "@/lib/queries/public-profile";
import { dedupePiecesInSwimlane } from "@/lib/profile/dedupe-pieces";

/** Usernames that use prototype mock shelves (never merge DB rows into these). */
export const MOCK_PROFILE_USERNAMES = new Set([
  "maya-cello",
  "leo-keys",
  "priya-violin",
  "sam-guitar",
]);

export function isMockProfileUsername(username: string): boolean {
  return MOCK_PROFILE_USERNAMES.has(username.trim().toLowerCase());
}

/**
 * Resolve shelf data for /u/[username]. Mock catalog profiles stay mock-only so
 * seeded DB rows cannot duplicate cards (e.g. two "Cello Suite No. 1" in learning).
 */
export function resolvePublicProfile(
  mock: PublicProfileData | null,
  db: PublicProfileData | null,
  username: string
): PublicProfileData | null {
  const slug = username.trim().toLowerCase();

  if (isMockProfileUsername(slug)) {
    return mock ?? db;
  }

  if (!mock && !db) return null;
  if (!db) return mock;
  if (!mock) return db;

  const learning = dedupePiecesInSwimlane([...db.learning, ...mock.learning]);
  const mastered = dedupePiecesInSwimlane([...db.mastered, ...mock.mastered]);
  const saved = dedupePiecesInSwimlane([...db.saved, ...mock.saved]);

  return {
    user: db.user,
    totalLibraryCount: Math.max(db.totalLibraryCount, mock.totalLibraryCount),
    publicPieceCount: learning.length + mastered.length + saved.length,
    vibeTags: collectProfileVibeTags([learning, mastered, saved]),
    learning,
    mastered,
    saved,
  };
}
