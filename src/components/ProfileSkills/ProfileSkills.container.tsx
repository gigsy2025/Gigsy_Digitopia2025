import type { ProfileSkillsProps } from "./types";
import { ProfileSkillsUI } from "./ProfileSkills.ui";

export function ProfileSkills(props: ProfileSkillsProps) {
  return <ProfileSkillsUI {...props} />;
}
