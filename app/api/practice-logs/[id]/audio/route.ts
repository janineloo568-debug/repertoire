import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { practiceLogs } from "@/lib/db/schema";
import { getFileBuffer } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [log] = await db
    .select()
    .from(practiceLogs)
    .where(and(eq(practiceLogs.id, id), eq(practiceLogs.userId, session.user.id)))
    .limit(1);

  if (!log?.audioStorageKey || !log.audioMimeType) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const buffer = await getFileBuffer(log.audioStorageKey, session.user.id);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": log.audioMimeType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
