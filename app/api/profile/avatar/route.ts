import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { saveProfileAvatar } from "@/lib/storage";
import { NextResponse } from "next/server";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "Missing file" }, { status: 400 });
  }

  if (!ALLOWED.has(file.type)) {
    return NextResponse.json(
      { error: "Use a JPEG, PNG, or WebP image" },
      { status: 400 }
    );
  }

  const buf = Buffer.from(await file.arrayBuffer());
  try {
    const saved = await saveProfileAvatar(session.user.id, buf, file.type);
    await db
      .update(users)
      .set({ avatarStorageKey: saved.storageKey })
      .where(eq(users.id, session.user.id));

    const row = await db
      .select({ username: users.username })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1);

    return NextResponse.json({
      ok: true,
      avatarUrl: row[0]?.username
        ? `/api/users/${row[0].username}/avatar`
        : null,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await db
    .update(users)
    .set({ avatarStorageKey: null })
    .where(eq(users.id, session.user.id));

  return NextResponse.json({ ok: true });
}
