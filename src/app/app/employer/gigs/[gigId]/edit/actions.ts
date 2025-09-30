"use server";

import { revalidatePath } from "next/cache";

import { fetchMutation } from "convex/nextjs";
import type { Id } from "convex/_generated/dataModel";

import { api } from "convex/_generated/api";
import { getAuthToken } from "@/utils/fetchers-server";
import type { GigEditorPayload } from "../../_components/GigEditorForm";

const BASE_PATH = "/app/employer" as const;
const GIGS_PATH = `${BASE_PATH}/gigs` as const;

interface UpdateGigActionInput {
  gigId: Id<"gigs">;
  values: GigEditorPayload;
}

export async function updateGigAction({
  gigId,
  values,
}: UpdateGigActionInput) {
  const token = await getAuthToken();

  if (!token) {
    return {
      success: false,
      message: "Not authenticated",
    } as const;
  }

  try {
    const locationPatch = values.location
      ? {
          type: values.location.type,
          ...(values.location.city ? { city: values.location.city } : {}),
          ...(values.location.country
            ? { country: values.location.country }
            : {}),
        }
      : undefined;

    await fetchMutation(
      api.employerGigs.updateGig,
      {
        gigId,
        patch: {
          title: values.title,
          description: values.description,
          skills: values.skills,
          category: values.category,
          difficultyLevel: values.difficultyLevel,
          experienceRequired: values.experienceRequired,
          budget: {
            min: values.budget.min,
            max: values.budget.max,
            currency: values.budget.currency,
            type: values.budget.type,
          },
          deadline: values.deadline,
          applicationDeadline: values.applicationDeadline,
          estimatedDuration: values.estimatedDuration,
          ...(locationPatch ? { location: locationPatch } : {}),
          metadata: {
            isUrgent: values.metadata.isUrgent,
            isRemoteOnly: values.metadata.isRemoteOnly,
          },
        },
        expectedVersion: values.expectedVersion,
      },
      { token },
    );

    revalidatePath(`${GIGS_PATH}/${gigId}`);
    revalidatePath(GIGS_PATH);

    return {
      success: true,
      message: "Gig updated successfully",
    } as const;
  } catch (error) {
    console.error("[GigEditor] Failed to update gig", { gigId, error });

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update gig. Please try again.",
    } as const;
  }
}
