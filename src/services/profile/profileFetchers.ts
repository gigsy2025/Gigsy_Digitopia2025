import { cache } from "react";
import { preloadQuery, fetchQuery, fetchMutation } from "convex/nextjs";
import type { Preloaded } from "convex/react";
import { api } from "convex/_generated/api";
import type { FunctionReference } from "convex/server";
import type { Id } from "convex/_generated/dataModel";

import type { ProfileViewModel } from "./types";
import type { ProfileCreationInput } from "../../../shared/profile/profileCreationSchema";

export interface ProfileQueryOptions {
  token?: string;
  url?: string;
}

function resolveCreateProfileMutationRef(): FunctionReference<
  "mutation",
  "public",
  { input: ProfileCreationInput },
  ProfileViewModel,
  string | undefined
> {
  const ref = (
    api.profile as {
      createProfile?: FunctionReference<
        "mutation",
        "public",
        { input: ProfileCreationInput },
        ProfileViewModel,
        string | undefined
      >;
    }
  ).createProfile;

  if (!ref) {
    throw new Error(
      "The createProfile mutation reference is missing. Run `npx convex dev` to regenerate Convex types.",
    );
  }

  return ref;
}

function sanitizeOptions(options?: ProfileQueryOptions) {
  return options ?? {};
}

export const preloadProfileBySlug = cache(
  async (
    slug: string,
    options?: ProfileQueryOptions,
  ): Promise<Preloaded<typeof api.profile.getProfileBySlug>> => {
    if (!slug?.trim()) {
      throw new Error("Cannot preload profile without a slug");
    }

    return preloadQuery(
      api.profile.getProfileBySlug,
      { slug },
      sanitizeOptions(options),
    );
  },
);

export const preloadProfileByUserId = cache(
  async (
    userId: Id<"users">,
    options?: ProfileQueryOptions,
  ): Promise<Preloaded<typeof api.profile.getProfileByUserId>> => {
    return preloadQuery(
      api.profile.getProfileByUserId,
      { userId },
      sanitizeOptions(options),
    );
  },
);

export async function fetchProfileBySlug(
  slug: string,
  options?: ProfileQueryOptions,
): Promise<ProfileViewModel | null> {
  if (!slug?.trim()) {
    return null;
  }

  const result = await fetchQuery(
    api.profile.getProfileBySlug,
    { slug },
    sanitizeOptions(options),
  );

  return (result as ProfileViewModel | null) ?? null;
}

export async function createProfileMutation(
  input: ProfileCreationInput,
  options?: ProfileQueryOptions,
): Promise<ProfileViewModel> {
  const result = await fetchMutation(
    resolveCreateProfileMutationRef(),
    {
      input,
    },
    sanitizeOptions(options),
  );

  if (!result) {
    throw new Error("Failed to create profile");
  }

  return result;
}

export async function fetchProfileByUserId(
  userId: Id<"users">,
  options?: ProfileQueryOptions,
): Promise<ProfileViewModel | null> {
  const result = await fetchQuery(
    api.profile.getProfileByUserId,
    { userId },
    sanitizeOptions(options),
  );

  return (result as ProfileViewModel | null) ?? null;
}
