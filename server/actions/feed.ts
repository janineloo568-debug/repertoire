"use server";

import { and, eq, inArray, isNull, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { pieceTags, pieces, tags } from "@/lib/db/schema";
import { setPieceTags } from "@/server/actions/pieces";

function slugify(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

async function resolveTagIdsForUser(
  sourceTagIds: string[],
  ownerUserId: string,
  viewerUserId: string
): Promise<string[]> {
  if (sourceTagIds.length === 0) return [];

  const sourceTags = await db
    .select({
      id: tags.id,
      slug: tags.slug,
      displayName: tags.displayName,
      userId: tags.userId,
      isPreset: tags.isPreset,
    })
    .from(tags)
    .where(inArray(tags.id, sourceTagIds));

  const viewerTags = await db
    .select({ id: tags.id, slug: tags.slug, displayName: tags.displayName })
    .from(tags)
    .where(or(isNull(tags.userId), eq(tags.userId, viewerUserId)));

  const viewerBySlug = new Map(viewerTags.map((t) => [t.slug, t.id]));
  const resolved: string[] = [];

  for (const st of sourceTags) {
    if (st.isPreset || st.userId === null) {
      if (viewerBySlug.has(st.slug)) resolved.push(viewerBySlug.get(st.slug)!);
      continue;
    }
    if (st.userId !== ownerUserId) continue;

    const existing = viewerBySlug.get(st.slug);
    if (existing) {
      resolved.push(existing);
      continue;
    }

    const slug = st.slug || slugify(st.displayName);
    const [created] = await db
      .insert(tags)
      .values({
        userId: viewerUserId,
        slug,
        displayName: st.displayName,
        isPreset: false,
      })
      .returning({ id: tags.id });

    if (created?.id) {
      viewerBySlug.set(slug, created.id);
      resolved.push(created.id);
    }
  }

  return [...new Set(resolved)];
}

export async function savePublicPieceToLibrary(publicPieceId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const row = await db
    .select()
    .from(pieces)
    .where(and(eq(pieces.id, publicPieceId), eq(pieces.isPublic, true)))
    .limit(1);

  const source = row[0];
  if (!source) return { error: "not_found" as const };
  if (source.userId === session.user.id) return { error: "own_piece" as const };

  const existing = await db
    .select({ id: pieces.id })
    .from(pieces)
    .where(and(eq(pieces.userId, session.user.id), eq(pieces.title, source.title)))
    .limit(1);

  if (existing[0]) return { id: existing[0].id, existing: true as const };

  const [created] = await db
    .insert(pieces)
    .values({
      userId: session.user.id,
      title: source.title,
      composer: source.composer,
      instrument: source.instrument,
      difficulty: source.difficulty,
      sourceType: "external_link",
      externalUrl: source.externalUrl,
      storageKey: null,
      repertoireStatus: "learning",
      isPublic: false,
    })
    .returning({ id: pieces.id });

  if (!created?.id) return { error: "create_failed" as const };

  const sourceTagRows = await db
    .select({ tagId: pieceTags.tagId })
    .from(pieceTags)
    .where(eq(pieceTags.pieceId, publicPieceId));

  const tagIds = await resolveTagIdsForUser(
    sourceTagRows.map((r) => r.tagId),
    source.userId,
    session.user.id
  );

  if (tagIds.length > 0) {
    await setPieceTags({ pieceId: created.id, tagIds });
  }

  revalidatePath("/library");
  return { id: created.id, existing: false as const };
}
