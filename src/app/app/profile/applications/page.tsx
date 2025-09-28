import type { Metadata } from "next";
import { Suspense } from "react";

import { requireUser } from "@/lib/auth/requireUser";
import { preloadApplications } from "@/utils/fetchers-server";
import { ApplicationsContent } from "../../../../components/applications/ApplicationsContent";
import { ApplicationsSkeleton } from "../../../../components/applications/ApplicationsSkeleton";

export const metadata: Metadata = {
  title: "My applications | Gigsy",
  description: "Track every gig application and stay ahead of next steps.",
};

export default async function ApplicationsPage() {
  await requireUser({ returnTo: "/app/profile/applications" });

  const preloaded = await preloadApplications();

  return (
    <div className="flex flex-1 flex-col gap-8">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-foreground text-3xl font-semibold">
              My applications
            </h1>
            <p className="text-muted-foreground">
              Stay on top of where you stand and follow up with confidence.
            </p>
          </div>
        </div>
      </header>

      <Suspense fallback={<ApplicationsSkeleton />}>
        <ApplicationsContent preloaded={preloaded} />
      </Suspense>
    </div>
  );
}
