import type { ProfileAboutProps } from "./types";
import { ProfileAboutUI } from "./ProfileAbout.ui";

export function ProfileAbout(props: ProfileAboutProps) {
  return <ProfileAboutUI {...props} />;
}
