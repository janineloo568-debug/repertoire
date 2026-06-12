"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ProfileAvatar } from "@/components/profile/ProfileAvatar";

export function ProfileAvatarUpload({
  name,
  username,
  avatarUrl,
}: {
  name: string;
  username: string;
  avatarUrl: string | null;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function upload(file: File) {
    setError(null);
    const form = new FormData();
    form.set("file", file);
    startTransition(async () => {
      const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
      const data = (await res.json()) as { error?: string; avatarUrl?: string | null };
      if (!res.ok) {
        setError(data.error ?? "Upload failed");
        return;
      }
      setPreview(data.avatarUrl ?? preview);
      router.refresh();
    });
  }

  function remove() {
    setError(null);
    startTransition(async () => {
      await fetch("/api/profile/avatar", { method: "DELETE" });
      setPreview(null);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <Label>Profile photo</Label>
      <div className="flex flex-wrap items-center gap-5">
        <ProfileAvatar
          name={name}
          username={username || "you"}
          avatarUrl={preview}
          size="lg"
        />
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
              e.target.value = "";
            }}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => inputRef.current?.click()}
          >
            {pending ? "Uploading…" : preview ? "Change photo" : "Upload photo"}
          </Button>
          {preview ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-sheet-muted"
              disabled={pending}
              onClick={remove}
            >
              Remove photo
            </Button>
          ) : null}
          <p className="text-xs text-sheet-muted">JPEG, PNG, or WebP · max 5MB</p>
        </div>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
