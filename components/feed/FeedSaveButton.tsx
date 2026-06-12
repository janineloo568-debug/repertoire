"use client";

import { WantToLearnButton } from "@/components/profile/WantToLearnButton";

export function FeedSaveButton({ pieceId }: { pieceId: string }) {
  return <WantToLearnButton pieceId={pieceId} />;
}
