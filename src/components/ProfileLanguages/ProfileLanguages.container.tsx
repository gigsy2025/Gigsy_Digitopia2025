import type { ProfileLanguagesProps } from "./types";
import { ProfileLanguagesUI } from "./ProfileLanguages.ui";

export function ProfileLanguages(props: ProfileLanguagesProps) {
  return <ProfileLanguagesUI {...props} />;
}
