"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProfileAvatarUpload } from "@/components/settings/ProfileAvatarUpload";
import { profileAvatarUrl } from "@/lib/profile/section-theme";
import { instrumentValues } from "@/lib/validations/piece";
import { instrumentChipLabel } from "@/lib/utils/instrument-emoji";
import { setUsername, updateProfile } from "@/server/actions/profile";

type ProfileData = {
  username: string | null;
  name: string | null;
  bio: string | null;
  instrumentsPlayed: string[];
  avatarStorageKey: string | null;
};

export function ProfileSettings({ profile }: { profile: ProfileData }) {
  const router = useRouter();
  const [username, setUsernameValue] = useState(profile.username ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [instruments, setInstruments] = useState<Set<string>>(
    () => new Set(profile.instrumentsPlayed ?? [])
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const displayName = profile.name?.trim() || profile.username || "Musician";
  const avatarUrl =
    profile.username && profile.avatarStorageKey
      ? profileAvatarUrl(profile.username, true)
      : null;

  function toggleInstrument(value: string) {
    setInstruments((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  }

  function saveAll() {
    setError(null);
    startTransition(async () => {
      const profileRes = await updateProfile({
        bio: bio || null,
        instrumentsPlayed: [...instruments],
      });
      if (profileRes && "error" in profileRes && profileRes.error) {
        setError("Could not save profile details");
        return;
      }

      const usernameNorm = username.trim();
      if (usernameNorm && usernameNorm !== (profile.username ?? "")) {
        const res = await setUsername({ username: usernameNorm });
        if (res && "error" in res && res.error) {
          const msg =
            typeof res.error === "object" && res.error.username
              ? res.error.username[0]
              : "Could not save username";
          setError(msg ?? "Could not save username");
          return;
        }
      }

      router.refresh();
    });
  }

  return (
    <section className="mt-10">
      <div className="overflow-hidden rounded-xl border border-sheet-border bg-gradient-to-br from-violet-50/80 via-white to-amber-50/50 p-6 shadow-sm">
        <h2 className="font-display text-lg font-normal text-sheet-ink">✨ Public shelf</h2>
        <p className="mt-2 text-sm text-sheet-muted">
          Your shareable profile at <code className="text-xs">/u/username</code>. Emojis in your
          bio and instrument picks show on your shelf — have fun with it!
        </p>

        <div className="mt-6">
          <ProfileAvatarUpload
            name={displayName}
            username={profile.username ?? "you"}
            avatarUrl={avatarUrl}
          />
        </div>

        <div className="mt-6 space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="flex gap-2">
            <span className="flex h-9 items-center rounded-l-md border border-r-0 border-sheet-border bg-sheet-cream px-3 text-sm text-sheet-muted">
              /u/
            </span>
            <Input
              id="username"
              className="rounded-l-none"
              value={username}
              onChange={(e) => setUsernameValue(e.target.value.toLowerCase())}
              placeholder="janine"
              autoComplete="off"
            />
          </div>
          {profile.username ? (
            <p className="text-xs text-sheet-muted">
              Live profile:{" "}
              <a href={`/u/${profile.username}`} className="font-medium text-sheet-accent underline">
                /u/{profile.username}
              </a>
            </p>
          ) : null}
        </div>

        <div className="mt-4 space-y-2">
          <Label htmlFor="bio">Short bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="🎹 Jazz pianist in Brooklyn · learning film scores for cocktail gigs ✨"
            rows={4}
            maxLength={320}
          />
          <p className="text-xs text-sheet-muted">
            Tip: paste emojis freely — they appear on your public shelf.
          </p>
        </div>

        <div className="mt-4 space-y-2">
          <Label>Instruments you play</Label>
          <div className="flex flex-wrap gap-2">
            {instrumentValues.map((inst) => {
              const on = instruments.has(inst);
              return (
                <button
                  key={inst}
                  type="button"
                  onClick={() => toggleInstrument(inst)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                    on
                      ? "border-sheet-accent bg-sheet-accent text-white shadow-sm"
                      : "border-sheet-border bg-white text-sheet-ink hover:border-sheet-accent/40"
                  }`}
                >
                  {instrumentChipLabel(inst)}
                </button>
              );
            })}
          </div>
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
        <Button type="button" className="mt-6" onClick={saveAll} disabled={pending}>
          {pending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </section>
  );
}
