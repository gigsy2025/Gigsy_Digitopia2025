"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { auth } from "@clerk/nextjs/server";
import { ConvexError } from "convex/values";
import { z } from "zod";

import { ProfileUpdateInputSchema } from "../../../../../../shared/profile/profileCreationSchema";
import { createProfileService } from "@/services/profile";
import { resolveCurrentUser } from "@/lib/auth/userResolver.server";
import type { Id } from "convex/_generated/dataModel";
import { cacheTags } from "@/lib/server/cache-tags";

const UpdateProfilePayloadSchema = z.object({
  profileSlug: z.string().trim().min(1),
  profileRecordId: z.string().trim().min(1),
  input: ProfileUpdateInputSchema,
});

export type ProfileUpdatePayload = z.infer<typeof UpdateProfilePayloadSchema>;

export interface ProfileUpdateResult {
  success: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function submitProfileUpdate(
  payload: ProfileUpdatePayload,
): Promise<ProfileUpdateResult> {
  const parsedPayload = UpdateProfilePayloadSchema.safeParse(payload);

  if (!parsedPayload.success) {
    const { formErrors, fieldErrors } = parsedPayload.error.flatten();
    const normalizedFieldErrors: Record<string, string[]> = Object.fromEntries(
      Object.entries(fieldErrors).map(([key, value]) => [
        key,
        (value ?? []).filter((entry): entry is string => Boolean(entry)),
      ]),
    );

    return {
      success: false,
      message: formErrors.join(" ") || "Invalid profile update request.",
      fieldErrors: normalizedFieldErrors,
    };
  }

  const { profileSlug, profileRecordId, input } = parsedPayload.data;
  const profileId = profileRecordId as Id<"profiles">;

  const clerkAuth = await auth();
  const token = await clerkAuth.getToken({ template: "convex" });
  if (!token) {
    return {
      success: false,
      message: "Authentication required to update profile.",
    };
  }

  const currentUser = await resolveCurrentUser();
  if (!currentUser) {
    return {
      success: false,
      message: "Authentication required to update profile.",
    };
  }

  try {
    const service = createProfileService({ token });
    const profile = await service.getProfile(profileSlug);

    if (!profile) {
      return {
        success: false,
        message: "Profile not found.",
      };
    }

    if (profile.summary.slug !== profileSlug) {
      return {
        success: false,
        message: "Profile identifier mismatch.",
      };
    }

    if (profile.summary.profileRecordId !== profileRecordId) {
      return {
        success: false,
        message: "Profile identifier mismatch.",
      };
    }

    const updatedProfile = await service.updateProfile(profileId, input);

    revalidatePath(`/app/profile/${profileSlug}`);
    revalidateTag(cacheTags.profiles.bySlug(profileSlug));
    revalidateTag(cacheTags.profiles.byUserId(updatedProfile.summary.userId));

    return {
      success: true,
      message: "Profile updated successfully.",
    };
  } catch (error) {
    const message =
      error instanceof ConvexError
        ? error.message
        : "Failed to update profile.";

    console.error("[ProfileEdit] submitProfileUpdate failed", error);
    return {
      success: false,
      message,
    };
  }
}
