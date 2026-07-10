import { NextRequest, NextResponse } from "next/server";
import { resolveArtworkUrl } from "@/lib/artwork/resolve";

export const revalidate = 86400;

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title") ?? "";
  const composer = req.nextUrl.searchParams.get("composer");
  const searchHint = req.nextUrl.searchParams.get("searchHint");

  if (!title.trim()) {
    return NextResponse.json({ url: null as string | null });
  }

  try {
    const url = await resolveArtworkUrl(title, composer, {
      searchHint: searchHint ?? undefined,
    });
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ url: null as string | null });
  }
}
