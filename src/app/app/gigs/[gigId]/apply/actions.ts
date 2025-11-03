"use server";

import { revalidatePath, revalidateTag } from "next/cache";

import { fetchMutation } from "convex/nextjs";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

import { auth } from "@clerk/nextjs/server";

import type { GigApplyFormValues } from "@/components/gigs/apply/GigApplyForm";
import { requireUser } from "@/lib/auth/requireUser";
import {
  cacheTags,
  resolveGigDataSource,
  serializeCacheTag,
} from "@/lib/server/cache-tags";

const gigsDataSource = resolveGigDataSource();

function sanitizeCoverLetter(input: string): string {
  return input.trim();
}

function sanitizePortfolioUrl(input: string): string {
  return input.trim();
}

export interface ApplyToGigInput extends GigApplyFormValues {
  gigId: string;
}

export interface ApplyToGigResult {
  success: boolean;
  message: string;
  status?: string | null;
  applicationId?: string | null;
  isDuplicate?: boolean;
  duplicateMessage?: string;
}

function toGigId(id: string): Id<"gigs"> {
  return id as Id<"gigs">;
}

function formatStatus(status?: string | null): string | null {
  if (!status) {
    return null;
  }

  const friendlyMap: Record<string, string> = {
    submitted: "Submitted",
    in_review: "In review",
    shortlisted: "Shortlisted",
    rejected: "Rejected",
    hired: "Hired",
    withdrawn: "Withdrawn",
  };

  return friendlyMap[status] ?? status;
}

export async function applyToGigAction(
  input: ApplyToGigInput,
): Promise<ApplyToGigResult> {
  const { gigId, coverLetter, portfolioUrl } = input;

  if (!gigId) {
    return {
      success: false,
      message: "Missing gig identifier.",
    };
  }

  await requireUser({ returnTo: `/app/gigs/${gigId}/apply` });

  const clerkAuth = await auth();
  const convexToken = await clerkAuth.getToken({ template: "convex" });

  if (!convexToken) {
    return {
      success: false,
      message: "Unable to authenticate with Convex. Please try again.",
    };
  }

  try {
    const result = await fetchMutation(
      api.applications.submit,
      {
        gigId: toGigId(gigId),
        coverLetter: sanitizeCoverLetter(coverLetter),
        portfolioUrl: sanitizePortfolioUrl(portfolioUrl),
      },
      {
        token: convexToken,
      },
    );

    revalidatePath(`/app/gigs/${gigId}`);
    revalidatePath("/app/profile/applications");
    revalidateTag(serializeCacheTag(cacheTags.gigs.list(gigsDataSource)));
    revalidateTag(serializeCacheTag(cacheTags.gigs.detail(gigId)));
    revalidateTag(serializeCacheTag(cacheTags.gigs.related(gigId)));

    if (result.isDuplicate) {
      return {
        success: false,
        message: "You have already applied to this gig.",
        status: result.status,
        applicationId: result.applicationId,
        isDuplicate: true,
        duplicateMessage:
          formatStatus(result.status) != null
            ? `Current application status: ${formatStatus(result.status)}.`
            : undefined,
      } satisfies ApplyToGigResult;
    }

    return {
      success: true,
      message: "Your application has been submitted!",
      status: result.status,
      applicationId: result.applicationId,
      isDuplicate: false,
    } satisfies ApplyToGigResult;
  } catch (error) {
    const fallbackMessage =
      error instanceof Error ? error.message : "Failed to submit application.";

    return {
      success: false,
      message: fallbackMessage,
      isDuplicate: false,
    };
  }
}
