import { redirect } from "next/navigation";

import { resolveCurrentUser } from "@/lib/auth/userResolver.server";

export const dynamic = "force-dynamic";

export default async function ProfileSelfRedirectPage() {
  const user = await resolveCurrentUser();

  if (!user) {
    redirect("/sign-in");
  }

  const profileSlug = user.username ?? user.id;
  redirect(`/app/profile/${profileSlug}`);
}
