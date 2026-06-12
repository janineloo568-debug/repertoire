import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { PRESET_TAG_SLUGS, presetDisplayName } from "@/lib/tags/presets";

export async function ensurePresetTags(): Promise<void> {
  for (const slug of PRESET_TAG_SLUGS) {
    const existing = await db
      .select({ id: tags.id })
      .from(tags)
      .where(and(eq(tags.slug, slug), isNull(tags.userId)))
      .limit(1);
    if (existing[0]) continue;
    await db.insert(tags).values({
      slug,
      displayName: presetDisplayName(slug),
      isPreset: true,
      userId: null,
    });
  }
}
