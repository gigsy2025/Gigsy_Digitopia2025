"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { auth } from "@clerk/nextjs/server";
import {
  ProfileCreationInputSchema,
  type ProfileCreationInput,
} from "../../../../../shared/profile/profileCreationSchema";
import { createProfileMutation } from "@/services/profile/profileFetchers";

export interface ProfileCreationResult {
  success: boolean;
  slug: string;
}

export async function submitProfileOnboarding(
  input: ProfileCreationInput,
): Promise<ProfileCreationResult> {
  const parsed = ProfileCreationInputSchema.safeParse(input);

  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    const messages = Object.entries(fieldErrors)
      .flatMap(([field, errors]) =>
        errors ? errors.map((error) => `${field}: ${error}`) : [],
      )
      .filter(Boolean);

    const message = messages.length
      ? `Invalid profile submission: ${messages.join("; ")}`
      : "Invalid profile submission payload";

    throw new Error(message);
  }

  const clerkAuth = await auth();
  const token = await clerkAuth.getToken({ template: "convex" });

  if (!token) {
    throw new Error("Authentication required to create a profile.");
  }

  const profile = await createProfileMutation(parsed.data, { token });

  const slug = profile.summary.slug;
  revalidatePath(`/app/profile/${slug}`);
  redirect(`/app/profile/${slug}`);
}
