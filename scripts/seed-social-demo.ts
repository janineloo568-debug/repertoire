/**
 * Optional demo users for feed empty-state browsing.
 * Run: npx tsx scripts/seed-social-demo.ts
 */
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { feedActivities, pieceTags, pieces, tags, users } from "@/lib/db/schema";
import { ensurePresetTags } from "@/lib/tags/ensure-presets";

const demos = [
  {
    username: "clara-keys",
    name: "Clara",
    email: "clara-demo@repertoire.local",
    pieces: [
      {
        title: "Clair de Lune",
        composer: "Debussy",
        status: "learning" as const,
        tagSlug: "rainy-day",
      },
      {
        title: "Prelude in C Major",
        composer: "Bach",
        status: "mastered" as const,
        tagSlug: "comfort-piece",
      },
    ],
  },
  {
    username: "strings-sam",
    name: "Sam",
    email: "sam-demo@repertoire.local",
    pieces: [
      {
        title: "Sarabande",
        composer: "Handel",
        status: "saved" as const,
        tagSlug: "dark-academia",
      },
    ],
  },
];

async function main() {
  await ensurePresetTags();
  const presetTags = await db.select().from(tags).where(eq(tags.isPreset, true));
  const tagBySlug = new Map(presetTags.map((t) => [t.slug, t.id]));

  for (const demo of demos) {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, demo.username))
      .limit(1);

    let userId = existing[0]?.id;
    if (!userId) {
      const passwordHash = await hash("demo-demo-demo", 8);
      const [u] = await db
        .insert(users)
        .values({
          email: demo.email,
          name: demo.name,
          username: demo.username,
          passwordHash,
        })
        .returning({ id: users.id });
      userId = u?.id;
    }

    if (!userId) continue;

    for (const p of demo.pieces) {
      const [piece] = await db
        .insert(pieces)
        .values({
          userId,
          title: p.title,
          composer: p.composer,
          instrument: "piano",
          difficulty: 3,
          sourceType: "external_link",
          externalUrl: "https://imslp.org",
          isPublic: true,
          repertoireStatus: p.status,
        })
        .returning({ id: pieces.id });

      if (!piece?.id) continue;

      const tagId = tagBySlug.get(p.tagSlug);
      if (tagId) {
        await db.insert(pieceTags).values({ pieceId: piece.id, tagId });
        await db.insert(feedActivities).values({
          userId,
          type: "piece_added",
          pieceId: piece.id,
        });
        await db.insert(feedActivities).values({
          userId,
          type: "tag_added",
          pieceId: piece.id,
          tagId,
        });
      }
    }
  }

  console.log("Demo profiles ready: /u/clara-keys, /u/strings-sam");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
