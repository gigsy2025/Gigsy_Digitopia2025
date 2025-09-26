import type { Preloaded } from "convex/react";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

import type { ProfileViewModel } from "./types";
import type { ProfileRepository } from "./ProfileRepository";
import type { ProfileQueryOptions } from "./profileFetchers";
import {
  preloadProfileBySlug,
  preloadProfileByUserId,
} from "./profileFetchers";

export interface ProfileService {
  getProfile(slug: string): Promise<ProfileViewModel | null>;
  getProfileByUserId(userId: Id<"users">): Promise<ProfileViewModel | null>;
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
