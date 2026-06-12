import { notFound } from "next/navigation";
import { PublicPieceDetail } from "@/components/profile/PublicPieceDetail";
import { getPublicPieceForUser, getUserByUsername } from "@/lib/queries/public-profile";
import { isPrototypeMockEnabled } from "@/lib/prototype/config";
import { getMockPiece, getMockProfile } from "@/lib/prototype/mock-data";

export const dynamic = "force-dynamic";

export default async function PublicPiecePage({
  params,
}: {
  params: Promise<{ username: string; pieceId: string }>;
}) {
  const { username, pieceId } = await params;
  const prototype = isPrototypeMockEnabled();
  const mockProfile = prototype ? getMockProfile(username) : null;
  const mockPiece = mockProfile ? getMockPiece(username, pieceId) : null;

  if (mockPiece && mockProfile) {
    return (
      <div className="mx-auto max-w-xl px-4 py-8">
        <PublicPieceDetail
          piece={mockPiece}
          owner={{ username: mockProfile.user.username, name: mockProfile.user.name }}
        />
      </div>
    );
  }

  const user = await getUserByUsername(username);
  if (!user) notFound();

  const piece = await getPublicPieceForUser(pieceId, user.id);
  if (!piece) notFound();

  return (
    <div className="mx-auto max-w-xl px-4 py-8">
      <PublicPieceDetail
        piece={piece}
        owner={{ username: user.username!, name: user.name }}
      />
    </div>
  );
}
