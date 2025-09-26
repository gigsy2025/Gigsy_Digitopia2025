import {
  createProfileRepository,
  type ConvexProfileRepositoryOptions,
} from "./ProfileRepository";
import { DefaultProfileService } from "./ProfileService";

export function createProfileService(options?: ConvexProfileRepositoryOptions) {
  const repository = createProfileRepository(options);
  return new DefaultProfileService(repository);
}

export type { ProfileViewModel } from "./types";
