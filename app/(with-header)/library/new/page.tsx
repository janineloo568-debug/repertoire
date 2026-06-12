import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AddPieceForm } from "@/components/library/AddPieceForm";

export const dynamic = "force-dynamic";

export default async function NewPiecePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <p className="mb-6 text-sm text-sheet-muted">
        <Link href="/library" className="font-medium text-sheet-accent underline hover:text-sheet-accent-hover">
          ← Back to library
        </Link>
      </p>
      <AddPieceForm />
    </div>
  );
}
