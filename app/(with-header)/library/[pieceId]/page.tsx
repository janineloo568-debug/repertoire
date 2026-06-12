import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, isNull, or } from "drizzle-orm";
import { auth } from "@/auth";
import { PieceDetailForm } from "@/components/library/PieceDetailForm";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/db";
import { tags } from "@/lib/db/schema";
import { getPieceForUser } from "@/lib/queries/pieces";
import { getUserProfile } from "@/lib/queries/user";
import { ensurePresetTags } from "@/lib/tags/ensure-presets";

export const dynamic = "force-dynamic";

export default async function PieceDetailPage({ params }: { params: Promise<{ pieceId: string }> }) {
  const { pieceId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  await ensurePresetTags();

  const data = await getPieceForUser(pieceId, session.user.id);
  if (!data) {
    redirect("/library");
  }

  const profile = await getUserProfile(session.user.id);

  const allTags = await db
    .select({
      id: tags.id,
      displayName: tags.displayName,
      isPreset: tags.isPreset,
    })
    .from(tags)
    .where(or(isNull(tags.userId), eq(tags.userId, session.user.id)))
    .orderBy(desc(tags.isPreset), tags.displayName);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <p className="mb-6 text-sm text-sheet-muted">
        <Link href="/library" className="font-medium text-sheet-accent underline hover:text-sheet-accent-hover">
          ← Library
        </Link>
      </p>
      <h1 className="font-display mb-4 text-3xl font-normal tracking-tight text-sheet-ink">{data.piece.title}</h1>
      <div className="mb-8 flex flex-wrap items-center gap-2">
        <Badge variant="instrument" className="capitalize">
          {data.piece.instrument}
        </Badge>
        {data.tags.map((t) => (
          <Badge key={t.id} variant="vibe">
            {t.displayName}
          </Badge>
        ))}
      </div>
      <PieceDetailForm
        data={data}
        allTags={allTags}
        profileUsername={profile?.username ?? null}
      />
    </div>
  );
}
