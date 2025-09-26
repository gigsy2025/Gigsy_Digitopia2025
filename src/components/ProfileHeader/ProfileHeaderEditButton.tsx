"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import type { ProfileSummary } from "@/services/profile/types";

interface ProfileHeaderEditButtonProps {
  summary: Pick<ProfileSummary, "viewerCanEdit" | "slug">;
}

const FALLBACK_EDIT_ROUTE = "/app/profile/edit";
const EDIT_BUTTON_ANALYTICS_ID = "profile-edit-button";

function resolveEditHref(
  summary: Pick<ProfileSummary, "viewerCanEdit" | "slug">,
): string {
  if (!summary.slug?.trim()) {
    return FALLBACK_EDIT_ROUTE;
  }

  return `/app/profile/${summary.slug}/edit`;
}

export function ProfileHeaderEditButton({
  summary,
}: ProfileHeaderEditButtonProps) {
  if (!summary.viewerCanEdit) {
    return null;
  }

  return (
    <Button asChild variant="secondary">
      <Link
        href={resolveEditHref(summary)}
        prefetch={false}
        className="hover:bg-secondary/90 focus-visible:ring-primary px-4 py-2 transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
        aria-label="Edit profile"
        data-analytics-id={EDIT_BUTTON_ANALYTICS_ID}
      >
        Edit profile
      </Link>
    </Button>
  );
}
