import type { ProfileSidebarProps } from "./types";
import { ProfileSidebarUI } from "./ProfileSidebar.ui";

export function ProfileSidebar(props: ProfileSidebarProps) {
  return <ProfileSidebarUI {...props} />;
}
