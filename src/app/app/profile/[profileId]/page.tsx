import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  createProfileService,
  type ProfileViewModel,
} from "@/services/profile";
import { ProfileHeader } from "@/components/ProfileHeader";
import { ProfileAbout } from "@/components/ProfileAbout";
import { ProfileSkills } from "@/components/ProfileSkills";
import { ProfileExperience } from "@/components/ProfileExperience";
import { ProfileEducation } from "@/components/ProfileEducation";
import { ProfileLanguages } from "@/components/ProfileLanguages";
import { ProfilePortfolio } from "@/components/ProfilePortfolio";
import { ProfileSidebar } from "@/components/ProfileSidebar";
import { resolveCurrentUser } from "@/lib/auth/userResolver.server";
import type { UserProfile } from "@/types/auth";

export const dynamic = "force-dynamic";

interface ProfilePageParams {
  profileId: string;
}

interface ProfilePageProps {
  params: Promise<ProfilePageParams>;
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { profileId } = await params;
  const service = createProfileService();

  try {
    const [profile, currentUser] = await Promise.all([
      service.getProfile(profileId),
      resolveCurrentUser(),
    ]);

    if (!profile) {
      return {
        title: "Profile not found | Gigsy",
        description: "The requested profile could not be located.",
      };
    }

    let effectiveProfile = profile;
    if (currentUser) {
      const currentUserSlug = currentUser.username ?? currentUser.id;
      const isViewingOwnProfile =
        profile.summary.userId === currentUser.id ||
        profile.summary.slug === currentUserSlug ||
        profileId === currentUserSlug;

      if (isViewingOwnProfile) {
        const clerkFullName = [currentUser.firstName, currentUser.lastName]
          .filter(Boolean)
          .join(" ")
          .trim();
        const displayName =
          clerkFullName ?? currentUser.name ?? profile.summary.fullName;

        effectiveProfile = {
          ...profile,
          summary: {
            ...profile.summary,
            fullName: displayName,
            avatarUrl: currentUser.avatar ?? profile.summary.avatarUrl,
            userId: currentUser.id,
            slug: currentUserSlug,
          },
        };
      }
    }

    const title = `${effectiveProfile.summary.fullName} | Gigsy Profile`;
    const description =
      effectiveProfile.summary.headline ??
      "Browse professional details and availability.";

    return {
      title,
      description,
      openGraph: {
        title,
        description,
      },
      twitter: {
        card: "summary_large_image",
        title,
        description,
      },
    };
  } catch (error) {
    console.error("[ProfilePage] Failed to build metadata", error);
    return {
      title: "Profile | Gigsy",
    };
  }
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { profileId } = await params;
  const service = createProfileService();

  const [profile, currentUser] = await Promise.all([
    service.getProfile(profileId),
    resolveCurrentUser(),
  ]);

  if (!profile) {
    notFound();
  }

  const viewContext = buildProfileViewContext(profile, currentUser, profileId);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 pb-12">
      <ProfileHeader summary={viewContext.summary} />

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="flex flex-col gap-6">
          <ProfileAbout about={viewContext.about} />
          <ProfileSkills skills={viewContext.skills} />
          <ProfileExperience experience={viewContext.experience} />
          <ProfileEducation education={viewContext.education} />
          <ProfileLanguages languages={viewContext.languages} />
          <ProfilePortfolio projects={viewContext.portfolio.projects} />
        </div>

        <aside className="flex flex-col gap-6">
          <ProfileSidebar sidebar={viewContext.sidebar} />
        </aside>
      </div>
    </div>
  );
}

function buildProfileViewContext(
  profile: ProfileViewModel,
  currentUser: UserProfile | null,
  profileId: string,
): ProfileViewModel {
  if (!currentUser) {
    return profile;
  }

  const currentUserSlug = currentUser.username ?? currentUser.id;
  const isViewingOwnProfile =
    profile.summary.userId === currentUser.id ||
    profile.summary.slug === currentUserSlug ||
    profileId === currentUserSlug;

  if (!isViewingOwnProfile) {
    return profile;
  }

  const clerkFullName = [currentUser.firstName, currentUser.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const displayName =
    clerkFullName ?? currentUser.name ?? profile.summary.fullName;

  return {
    ...profile,
    summary: {
      ...profile.summary,
      fullName: displayName,
      avatarUrl: currentUser.avatar ?? profile.summary.avatarUrl,
      userId: currentUser.id,
      slug: currentUserSlug,
    },
  };
}
