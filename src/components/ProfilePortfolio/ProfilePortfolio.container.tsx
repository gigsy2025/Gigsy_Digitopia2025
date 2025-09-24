import type { ProfilePortfolioProps } from "./types";
import { ProfilePortfolioUI } from "./ProfilePortfolio.ui";

export function ProfilePortfolio(props: ProfilePortfolioProps) {
  return <ProfilePortfolioUI {...props} />;
}
