"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { followUser, unfollowUser } from "@/server/actions/follows";

export function FollowButton({
  userId,
  initialFollowing,
  isSelf,
  isPrototype = false,
}: {
  userId: string;
  initialFollowing: boolean;
  isSelf: boolean;
  /** Mock profiles: follow state is local only (no server). */
  isPrototype?: boolean;
}) {
  const router = useRouter();
  const [following, setFollowing] = useState(initialFollowing);
  const [pending, startTransition] = useTransition();

  if (isSelf) return null;

  function toggle() {
    if (isPrototype) {
      setFollowing((f) => !f);
      return;
    }
    startTransition(async () => {
      if (following) {
        await unfollowUser(userId);
        setFollowing(false);
      } else {
        const res = await followUser(userId);
        if (res && "error" in res) return;
        setFollowing(true);
      }
      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant={following ? "outline" : "default"}
      onClick={toggle}
      disabled={pending}
      className="shrink-0"
    >
      {pending ? "…" : following ? "Following" : "Follow"}
    </Button>
  );
}
