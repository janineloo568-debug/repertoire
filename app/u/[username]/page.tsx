import { notFound } from "next/navigation";
import { PublicProfileBrowser } from "@/components/profile/PublicProfileBrowser";
import { getPublicProfileByUsername } from "@/lib/queries/public-profile";
import { resolvePublicProfile } from "@/lib/profile/merge-profile";
import { isPrototypeMockEnabled } from "@/lib/prototype/config";
import { getMockProfile } from "@/lib/prototype/mock-data";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const prototype = isPrototypeMockEnabled();
  const mockProfile = prototype ? getMockProfile(username) : null;
  const dbProfile = await getPublicProfileByUsername(username);
  const profile = resolvePublicProfile(mockProfile, dbProfile, username);
  if (!profile) notFound();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <PublicProfileBrowser profile={profile} />
    </div>
  );
}
