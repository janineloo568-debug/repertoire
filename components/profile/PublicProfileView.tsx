import type { PublicProfileData } from "@/lib/profile/types";
import { PublicProfileBrowser } from "@/components/profile/PublicProfileBrowser";

export function PublicProfileView({ profile }: { profile: PublicProfileData }) {
  return <PublicProfileBrowser profile={profile} />;
}
