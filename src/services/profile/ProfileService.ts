import type { Preloaded } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

import type { ProfileViewModel } from "./types";
import type { ProfileRepository } from "./ProfileRepository";
import type { ProfileQueryOptions } from "./profileFetchers";
import type { ProfileUpdateInput } from "shared/profile/profileCreationSchema";
import {
  preloadProfileBySlug,
  preloadProfileByUserId,
} from "./profileFetchers";

export interface ProfileService {
  getProfile(slug: string): Promise<ProfileViewModel | null>;
  getProfileByUserId(userId: Id<"users">): Promise<ProfileViewModel | null>;
  updateProfile(
    profileId: Id<"profiles">,
    input: ProfileUpdateInput,
  ): Promise<ProfileViewModel>;
  preloadProfile(
    slug: string,
    options?: ProfileQueryOptions,
  ): Promise<Preloaded<typeof api.profile.getProfileBySlug>>;
  preloadProfileByUserId(
    userId: Id<"users">,
    options?: ProfileQueryOptions,
  ): Promise<Preloaded<typeof api.profile.getProfileByUserId>>;
}

export class DefaultProfileService implements ProfileService {
  constructor(private readonly repository: ProfileRepository) {}

  async getProfile(slug: string): Promise<ProfileViewModel | null> {
    if (!slug?.trim()) {
      return null;
    }

    return this.repository.fetchProfileBySlug(slug);
  }

  async getProfileByUserId(
    userId: Id<"users">,
  ): Promise<ProfileViewModel | null> {
    return this.repository.fetchProfileByUserId(userId);
  }

  async updateProfile(
    profileId: Id<"profiles">,
    input: ProfileUpdateInput,
  ): Promise<ProfileViewModel> {
    return this.repository.updateProfile(profileId, input);
  }

  async preloadProfile(
    slug: string,
    options?: ProfileQueryOptions,
  ): Promise<Preloaded<typeof api.profile.getProfileBySlug>> {
    return preloadProfileBySlug(slug, options);
  }

  async preloadProfileByUserId(
    userId: Id<"users">,
    options?: ProfileQueryOptions,
  ): Promise<Preloaded<typeof api.profile.getProfileByUserId>> {
    return preloadProfileByUserId(userId, options);
  }
}
