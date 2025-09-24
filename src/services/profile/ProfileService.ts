import type { ProfileViewModel } from "./types";
import type { ProfileRepository } from "./ProfileRepository";

export interface ProfileService {
  getProfile(slug: string): Promise<ProfileViewModel | null>;
}

export class DefaultProfileService implements ProfileService {
  constructor(private readonly repository: ProfileRepository) {}

  async getProfile(slug: string): Promise<ProfileViewModel | null> {
    if (!slug?.trim()) {
      return null;
    }

    return this.repository.fetchProfileBySlug(slug);
  }
}
