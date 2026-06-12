import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProfileSettings } from "@/components/settings/ProfileSettings";
import { getUserProfile } from "@/lib/queries/user";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const profile = await getUserProfile(session.user.id);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-3xl font-normal tracking-tight text-sheet-ink">Settings</h1>
      <p className="mt-4 text-sheet-muted">
        Signed in as{" "}
        <span className="font-medium text-sheet-ink">
          {profile?.username ? `@${profile.username}` : session.user.name ?? "your account"}
        </span>
      </p>
      <ProfileSettings
        profile={{
          username: profile?.username ?? null,
          name: profile?.name ?? session.user.name ?? null,
          bio: profile?.bio ?? null,
          instrumentsPlayed: profile?.instrumentsPlayed ?? [],
          avatarStorageKey: profile?.avatarStorageKey ?? null,
        }}
      />
      <p className="mt-6 text-sm text-sheet-muted">
        Environment variables control database, file storage (S3-compatible), and optional OpenAI (richer suggestions).
        Suggestions work without OpenAI using free web links. See{" "}
        <code className="rounded border border-sheet-border bg-sheet-cream px-1.5 py-0.5 text-xs text-sheet-ink">
          .env.example
        </code>{" "}
        in the project.
      </p>
    </div>
  );
}
