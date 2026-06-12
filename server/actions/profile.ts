"use server";

import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { profileFormSchema } from "@/lib/validations/profile";
import { normalizeUsername, usernameSchema } from "@/lib/validations/username";

const setUsernameSchema = z.object({
  username: usernameSchema,
});

export async function setUsername(input: z.infer<typeof setUsernameSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = setUsernameSchema.safeParse({
    username: normalizeUsername(input.username),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const username = parsed.data.username;

  const taken = await db
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.username, username), ne(users.id, session.user.id)))
    .limit(1);

  if (taken[0]) return { error: { username: ["That username is taken"] } };

  await db.update(users).set({ username }).where(eq(users.id, session.user.id));

  revalidatePath("/settings");
  revalidatePath(`/u/${username}`);
  revalidatePath("/feed");
  return { ok: true as const, username };
}

export async function updateProfile(input: {
  bio?: string | null;
  instrumentsPlayed?: string[];
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = profileFormSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const bio = parsed.data.bio?.trim() || null;
  const instrumentsPlayed = parsed.data.instrumentsPlayed ?? [];

  await db
    .update(users)
    .set({ bio, instrumentsPlayed })
    .where(eq(users.id, session.user.id));

  const row = await db
    .select({ username: users.username })
    .from(users)
    .where(eq(users.id, session.user.id))
    .limit(1);

  revalidatePath("/settings");
  if (row[0]?.username) revalidatePath(`/u/${row[0].username}`);
  return { ok: true as const };
}
