"use client";

import { useMemo } from "react";
import type { ProfileHeaderProps } from "./types";
import { ProfileHeaderUI } from "./ProfileHeader.ui";
import { useUser } from "@/providers/UserContext";

export function ProfileHeaderContainer(props: ProfileHeaderProps) {
  const { user } = useUser();

  const summary = useMemo(() => {
    if (!user) {
      return {
        ...props.summary,
        viewerCanEdit: props.summary.viewerCanEdit ?? false,
      };
    }

    const normalizedSlug = user.username ?? user.id;
    const isSelf =
      props.summary.userId === user.id || props.summary.slug === normalizedSlug;

    if (!isSelf) {
      return {
        ...props.summary,
        viewerCanEdit: false,
      };
    }

    const clerkFullName = [user.firstName, user.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    const normalizedClerkName =
      clerkFullName.length > 0 ? clerkFullName : undefined;
    const displayName =
      normalizedClerkName ?? user.name ?? props.summary.fullName;

    return {
      ...props.summary,
      fullName: displayName,
      avatarUrl: user.avatar ?? props.summary.avatarUrl,
      userId: user.id,
      slug: normalizedSlug,
      viewerCanEdit: true,
    };
  }, [props.summary, user]);

  return <ProfileHeaderUI {...props} summary={summary} />;
}
