import type { ProfileEducationProps } from "./types";
import { ProfileEducationUI } from "./ProfileEducation.ui";

export function ProfileEducation(props: ProfileEducationProps) {
  return <ProfileEducationUI {...props} />;
}
