import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { createProfileService } from "@/services/profile";
import { ProfileEditForm } from "./ProfileEditForm";
import { resolveCurrentUser } from "@/lib/auth/userResolver.server";

export const dynamic = "force-dynamic";

interface ProfileEditPageParams {
  profileId: string;
}

interface ProfileEditPageProps {
  params: Promise<ProfileEditPageParams>;
}

export default async function ProfileEditPage({
  params,
}: ProfileEditPageProps) {
  const { profileId } = await params;

  const clerkAuth = await auth();
  const token = await clerkAuth.getToken({ template: "convex" });

  if (!token) {
    const redirectTarget = encodeURIComponent(`/app/profile/${profileId}/edit`);
    redirect(`/sign-in?redirect_url=${redirectTarget}`);
  }

  const currentUser = await resolveCurrentUser();
  if (!currentUser) {
    const redirectTarget = encodeURIComponent(`/app/profile/${profileId}/edit`);
    redirect(`/sign-in?redirect_url=${redirectTarget}`);
  }

  const service = createProfileService({ token });
  const profile = await service.getProfile(profileId);

  if (!profile) {
    redirect(`/app/profile/${profileId}`);
  }

  const normalizedSlug = currentUser.username ?? currentUser.id;
  const isOwner =
    profile.summary.userId === currentUser.id ||
    profile.summary.slug === normalizedSlug ||
    profileId === normalizedSlug;

  if (!isOwner) {
    redirect(`/app/profile/${profileId}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 pb-12">
      <ProfileEditForm profile={profile} currentUser={currentUser} />
    </div>
  );
}
