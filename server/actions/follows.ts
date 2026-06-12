"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { follows, users } from "@/lib/db/schema";

export async function followUser(followingId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (followingId === session.user.id) return { error: "self" as const };

  const target = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(eq(users.id, followingId))
    .limit(1);

  if (!target[0]?.username) return { error: "no_profile" as const };

  await db
    .insert(follows)
    .values({ followerId: session.user.id, followingId })
    .onConflictDoNothing();

  revalidatePath("/feed");
  if (target[0].username) revalidatePath(`/u/${target[0].username}`);
  return { ok: true as const };
}

export async function unfollowUser(followingId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const target = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, followingId))
    .limit(1);

  await db
    .delete(follows)
    .where(and(eq(follows.followerId, session.user.id), eq(follows.followingId, followingId)));

  revalidatePath("/feed");
  if (target[0]?.username) revalidatePath(`/u/${target[0].username}`);
  return { ok: true as const };
}
