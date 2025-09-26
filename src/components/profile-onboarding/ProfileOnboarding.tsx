import type { UserProfile } from "@/types/auth";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProfileOnboardingForm } from "./ProfileOnboardingForm";

export interface ProfileOnboardingProps {
  currentUser: UserProfile;
  desiredSlug: string;
}

export function ProfileOnboarding({
  currentUser,
  desiredSlug,
}: ProfileOnboardingProps) {
  return (
    <div className="flex flex-col gap-10">
      <Card className="border-primary/10 bg-primary/5">
        <CardContent className="flex flex-col gap-4 py-8">
          <div className="text-primary flex items-center gap-2">
            <Badge variant="outline" className="border-primary/40 text-primary">
              New
            </Badge>
            <p className="font-medium">Welcome to Gigsy Profiles</p>
          </div>
          <h2 className="text-2xl font-semibold">
            You&#39;re one step away from going live
          </h2>
          <p className="text-muted-foreground max-w-2xl">
            We didn&#39;t find a completed profile for this link yet. Fill in
            the essentials below so clients can discover you, then continue
            adding experience, portfolio, and more details anytime.
          </p>
        </CardContent>
      </Card>

      <ProfileOnboardingForm
        currentUser={currentUser}
        desiredSlug={desiredSlug}
      />
    </div>
  );
}
