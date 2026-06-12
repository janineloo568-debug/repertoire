import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { getStoredFileBuffer } from "@/lib/storage";
import { normalizeUsername } from "@/lib/validations/username";

const MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const slug = normalizeUsername(username);

  const row = await db
    .select({ avatarStorageKey: users.avatarStorageKey })
    .from(users)
    .where(eq(users.username, slug))
    .limit(1);

  const key = row[0]?.avatarStorageKey;
  if (!key || !key.includes("/avatar/")) {
    return new Response(null, { status: 404 });
  }

  try {
    const buf = await getStoredFileBuffer(key);
    const ext = key.split(".").pop()?.toLowerCase() ?? "jpg";
    const contentType = MIME[ext] ?? "image/jpeg";

    return new Response(new Uint8Array(buf), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      },
    });
  } catch {
    return new Response(null, { status: 404 });
  }
}
