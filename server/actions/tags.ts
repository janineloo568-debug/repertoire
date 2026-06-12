"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

const createTagSchema = z.object({
  displayName: z.string().min(1).max(80),
});

export async function createCustomTag(input: z.infer<typeof createTagSchema>) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const parsed = createTagSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.flatten() };

  const slug = slugify(parsed.data.displayName);
  if (!slug) return { error: "invalid_name" as const };

  const dup = await db
    .select({ id: tags.id })
    .from(tags)
    .where(and(eq(tags.userId, session.user.id), eq(tags.slug, slug)))
    .limit(1);

  if (dup[0]) {
    return { id: dup[0].id, existing: true as const };
  }

  const [row] = await db
    .insert(tags)
    .values({
      userId: session.user.id,
      slug,
      displayName: parsed.data.displayName.trim(),
      isPreset: false,
    })
    .returning({ id: tags.id });

  revalidatePath("/library");
  return { id: row?.id, existing: false as const };
}

export async function listTagsForUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const presets = await db
    .select()
    .from(tags)
    .where(eq(tags.isPreset, true))
    .orderBy(tags.displayName);

  const custom = await db
    .select()
    .from(tags)
    .where(eq(tags.userId, session.user.id))
    .orderBy(tags.displayName);

  return { presets, custom };
}
