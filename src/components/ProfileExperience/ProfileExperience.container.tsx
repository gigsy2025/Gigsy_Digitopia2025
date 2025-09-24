import type { ProfileExperienceProps } from "./types";
import { ProfileExperienceUI } from "./ProfileExperience.ui";

export function ProfileExperience(props: ProfileExperienceProps) {
  return <ProfileExperienceUI {...props} />;
}
