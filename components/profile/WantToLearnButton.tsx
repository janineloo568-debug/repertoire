"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { isMockId } from "@/lib/prototype/config";
import { savePublicPieceToLibrary } from "@/server/actions/feed";

export function WantToLearnButton({
  pieceId,
  size = "sm",
  className,
}: {
  pieceId: string;
  size?: "sm" | "default";
  className?: string;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save(e?: React.MouseEvent) {
    e?.preventDefault();
    e?.stopPropagation();
    if (isMockId(pieceId)) {
      setSaved(true);
      return;
    }
    if (!session?.user) {
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`);
      return;
    }
    startTransition(async () => {
      try {
        const res = await savePublicPieceToLibrary(pieceId);
        if (res && "id" in res && res.id) {
          setSaved(true);
          router.refresh();
        }
      } catch {
        router.push("/login");
      }
    });
  }

  return (
    <Button
      type="button"
      variant={saved ? "secondary" : "default"}
      size={size}
      className={className}
      onClick={save}
      disabled={pending || saved}
    >
      {saved ? "In your library" : pending ? "Adding…" : "Add to library"}
    </Button>
  );
}
