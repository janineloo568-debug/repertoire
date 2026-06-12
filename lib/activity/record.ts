import { db } from "@/lib/db";
import { feedActivities, type feedActivityTypes } from "@/lib/db/schema";

type ActivityType = (typeof feedActivityTypes)[number];

export async function recordFeedActivity(input: {
  userId: string;
  type: ActivityType;
  pieceId: string;
  tagId?: string | null;
  noteExcerpt?: string | null;
}) {
  await db.insert(feedActivities).values({
    userId: input.userId,
    type: input.type,
    pieceId: input.pieceId,
    tagId: input.tagId ?? null,
    noteExcerpt: input.noteExcerpt?.trim().slice(0, 280) ?? null,
  });
}
