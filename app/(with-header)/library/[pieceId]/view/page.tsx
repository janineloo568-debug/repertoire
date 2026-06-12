import Link from "next/link";
import { redirect } from "next/navigation";
import { ClientPdfShell } from "@/components/viewer/ClientPdfShell";
import { auth } from "@/auth";
import { getPieceForUser } from "@/lib/queries/pieces";

export const dynamic = "force-dynamic";

export default async function PieceViewPage({ params }: { params: Promise<{ pieceId: string }> }) {
  const { pieceId } = await params;
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const data = await getPieceForUser(pieceId, session.user.id);
  if (!data?.piece.storageKey) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-sheet-muted">This piece has no uploaded PDF. Open the external link from the piece page instead.</p>
        <Link
          href={`/library/${pieceId}`}
          className="mt-4 inline-block font-medium text-sheet-accent underline hover:text-sheet-accent-hover"
        >
          ← Back to piece
        </Link>
      </div>
    );
  }

  const fileUrl = `/api/pieces/${pieceId}/file`;

  return (
    <div className="flex min-h-[calc(100vh-5rem)] flex-col bg-sheet-canvas">
      <div className="border-b border-sheet-border bg-white px-4 py-3">
        <Link
          href={`/library/${pieceId}`}
          className="text-sm font-medium text-sheet-accent underline hover:text-sheet-accent-hover"
        >
          ← Back to piece
        </Link>
      </div>
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6">
        <ClientPdfShell fileUrl={fileUrl} title={data.piece.title} />
      </div>
    </div>
  );
}
