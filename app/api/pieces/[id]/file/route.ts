import { auth } from "@/auth";
import { db } from "@/lib/db";
import { pieces } from "@/lib/db/schema";
import { getFileBuffer } from "@/lib/storage";
import { and, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const session = await auth();
  if (!session?.user?.id) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const rows = await db
    .select()
    .from(pieces)
    .where(and(eq(pieces.id, id), eq(pieces.userId, session.user.id)))
    .limit(1);

  const piece = rows[0];
  if (!piece?.storageKey) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const buf = await getFileBuffer(piece.storageKey, session.user.id);
    return new NextResponse(new Uint8Array(buf), {
      headers: {
        "Content-Type": piece.mimeType ?? "application/pdf",
        "Content-Disposition": `inline; filename="${encodeURIComponent(piece.fileNameOriginal ?? "score.pdf")}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new NextResponse("Forbidden", { status: 403 });
  }
}
