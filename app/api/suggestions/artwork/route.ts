import { NextRequest, NextResponse } from "next/server";
import { fetchArtworkUrlFromItunes } from "@/lib/artwork/itunes";

export async function GET(req: NextRequest) {
  const title = req.nextUrl.searchParams.get("title") ?? "";
  const composer = req.nextUrl.searchParams.get("composer");

  if (!title.trim()) {
    return NextResponse.json({ url: null as string | null });
  }

  try {
    const url = await fetchArtworkUrlFromItunes(title, composer);
    return NextResponse.json({ url });
  } catch {
    return NextResponse.json({ url: null as string | null });
  }
}
