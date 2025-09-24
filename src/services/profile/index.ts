import { createProfileRepository } from "./ProfileRepository";
import { DefaultProfileService } from "./ProfileService";

export function createProfileService() {
  const repository = createProfileRepository();
  return new DefaultProfileService(repository);
}

export type { ProfileViewModel } from "./types";
