import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, isNull, or } from "drizzle-orm";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { PieceFilters } from "@/components/library/PieceFilters";
import { PieceTileGrid } from "@/components/library/PieceTileGrid";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { listPiecesForUser } from "@/lib/queries/pieces";
import { ensurePresetTags } from "@/lib/tags/ensure-presets";

export const dynamic = "force-dynamic";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await ensurePresetTags();

  const sp = await searchParams;
  const q = typeof sp.q === "string" ? sp.q : undefined;
  const instrument = typeof sp.instrument === "string" ? sp.instrument : undefined;
  const tagIds =
    typeof sp.tags === "string" && sp.tags.length > 0
      ? sp.tags.split(",").filter(Boolean)
      : undefined;
  const minDifficulty =
    typeof sp.min === "string" && sp.min !== "" ? Number(sp.min) : undefined;
  const maxDifficulty =
    typeof sp.max === "string" && sp.max !== "" ? Number(sp.max) : undefined;

  const rows = await listPiecesForUser(session.user.id, {
    search: q,
    instrument,
    tagIds,
    minDifficulty,
    maxDifficulty,
  });

  const tagOptions = await db
    .select({ id: tags.id, displayName: tags.displayName })
    .from(tags)
    .where(or(isNull(tags.userId), eq(tags.userId, session.user.id)))
    .orderBy(desc(tags.isPreset), tags.displayName);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-normal tracking-tight text-sheet-ink">Library</h1>
          <p className="mt-1 text-sm text-sheet-muted">
            Pieces you have saved — filter by vibe when you need the right mood.
          </p>
        </div>
        <Button asChild>
          <Link href="/library/new">Add piece</Link>
        </Button>
      </div>

      <PieceFilters tags={tagOptions} />
      <PieceTileGrid rows={rows} />
    </div>
  );
}
