import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function getUserProfile(userId: string) {
  const row = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      username: users.username,
      bio: users.bio,
      instrumentsPlayed: users.instrumentsPlayed,
      avatarStorageKey: users.avatarStorageKey,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row[0] ?? null;
}
