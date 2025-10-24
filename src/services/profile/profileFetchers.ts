import { cache } from "react";
import { preloadQuery, fetchQuery, fetchMutation } from "convex/nextjs";
import type { Preloaded } from "convex/react";
import { api } from "convex/_generated/api";
import type { FunctionReference } from "convex/server";
import type { Id } from "convex/_generated/dataModel";
import { unstable_cache } from "next/cache";

import type { ProfileViewModel } from "./types";
import type {
  ProfileCreationInput,
  ProfileUpdateInput,
} from "../../../shared/profile/profileCreationSchema";
import { cacheTags } from "@/lib/server/cache-tags";

export interface ProfileQueryOptions {
  token?: string;
  url?: string;
}

function resolveUpdateProfileMutationRef(): FunctionReference<
  "mutation",
  "public",
  { profileId: Id<"profiles"> } & ProfileUpdateInput,
  ProfileViewModel,
  string | undefined
> {
  const ref = (
    api.profile as {
      updateProfile?: FunctionReference<
        "mutation",
        "public",
        { profileId: Id<"profiles"> } & ProfileUpdateInput,
        ProfileViewModel,
        string | undefined
      >;
    }
  ).updateProfile;

  if (!ref) {
    throw new Error(
      "The updateProfile mutation reference is missing. Run `npx convex dev` to regenerate Convex types.",
    );
  }

  return ref;
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

const PROFILE_REVALIDATE_SECONDS = 300;

function shouldBypassCache(options?: ProfileQueryOptions): boolean {
  return Boolean(options?.token ?? options?.url);
}

function createProfileBySlugCache(slug: string) {
  return unstable_cache(
    async (): Promise<ProfileViewModel | null> => {
      const result = await fetchQuery(
        api.profile.getProfileBySlug,
        { slug },
        sanitizeOptions(),
      );

      return (result as ProfileViewModel | null) ?? null;
    },
    ["profiles", "bySlug", slug],
    {
      revalidate: PROFILE_REVALIDATE_SECONDS,
      tags: [cacheTags.profiles.bySlug(slug)],
    },
  );
}

function createProfileByUserCache(userId: Id<"users">) {
  return unstable_cache(
    async (): Promise<ProfileViewModel | null> => {
      const result = await fetchQuery(
        api.profile.getProfileByUserId,
        { userId },
        sanitizeOptions(),
      );

      return (result as ProfileViewModel | null) ?? null;
    },
    ["profiles", "byUserId", userId],
    {
      revalidate: PROFILE_REVALIDATE_SECONDS,
      tags: [cacheTags.profiles.byUserId(userId)],
    },
  );
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

  if (shouldBypassCache(options)) {
    const result = await fetchQuery(
      api.profile.getProfileBySlug,
      { slug },
      sanitizeOptions(options),
    );

    return (result as ProfileViewModel | null) ?? null;
  }

  return createProfileBySlugCache(slug)();
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

export async function updateProfileMutation(
  profileId: Id<"profiles">,
  input: ProfileUpdateInput,
  options?: ProfileQueryOptions,
): Promise<ProfileViewModel> {
  const result = await fetchMutation(
    resolveUpdateProfileMutationRef(),
    {
      profileId,
      ...input,
    },
    sanitizeOptions(options),
  );

  if (!result) {
    throw new Error("Failed to update profile");
  }

  return result;
}

export async function fetchProfileByUserId(
  userId: Id<"users">,
  options?: ProfileQueryOptions,
): Promise<ProfileViewModel | null> {
  if (shouldBypassCache(options)) {
    const result = await fetchQuery(
      api.profile.getProfileByUserId,
      { userId },
      sanitizeOptions(options),
    );

    return (result as ProfileViewModel | null) ?? null;
  }

  return createProfileByUserCache(userId)();
}
