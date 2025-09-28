"use client";

import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CompassIcon, SparklesIcon } from "lucide-react";
import { useMutation } from "convex/react";

import type { ApplicationWithGig } from "@/types/applications";
import { ApplicationCard } from "./ApplicationCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

interface ApplicationListContainerProps {
  applications: ApplicationWithGig[];
  hasMore: boolean;
  onLoadMore: () => void;
  showInsights?: boolean;
  onWithdrawSuccess?: (applicationId: Id<"applications">) => void;
}

export function ApplicationListContainer({
  applications,
  hasMore,
  onLoadMore,
  showInsights = false,
  onWithdrawSuccess,
}: ApplicationListContainerProps) {
  const router = useRouter();
  const toast = useToast();
  const withdrawMutation = useMutation(api.applications.withdraw);
  const [pendingId, setPendingId] = useState<Id<"applications"> | null>(null);

  const handleViewGig = useCallback(
    (gigId: string) => {
      router.push(`/app/gigs/${gigId}`);
    },
    [router],
  );

  const handleWithdraw = useCallback(
    async (applicationId: Id<"applications">) => {
      try {
        setPendingId(applicationId);
        await withdrawMutation({ applicationId });
        toast.success("Application withdrawn", 4000);
        onWithdrawSuccess?.(applicationId);
      } catch (error) {
        console.error("Failed to withdraw application", error);
        toast.error("Unable to withdraw application. Please try again.", 4000);
      } finally {
        setPendingId(null);
      }
    },
    [withdrawMutation, onWithdrawSuccess, toast],
  );

  const insightCopy = useMemo(() => {
    if (!showInsights) {
      return null;
    }

    return "AI sees a strong skills match. Keep an eye out for next steps.";
  }, [showInsights]);

  if (!applications.length) {
    return (
      <EmptyState
        title="No applications yet"
        description="You haven't applied to any gigs. Discover curated opportunities and submit your first application."
        actionLabel="Browse gigs"
        onAction={() => router.push("/app/gigs")}
        icon={<CompassIcon className="size-10" />}
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {applications.map((item) => (
        <ApplicationCard
          key={item.application._id}
          item={item}
          onViewGig={handleViewGig}
          onWithdraw={handleWithdraw}
          disableActions={
            pendingId !== null && pendingId !== item.application._id
          }
          isWithdrawing={pendingId === item.application._id}
          insight={insightCopy}
          showInsightBadge={showInsights}
        />
      ))}

      {showInsights ? (
        <div className="border-primary/40 bg-primary/5 text-primary flex items-center gap-2 rounded-md border border-dashed p-4 text-sm">
          <SparklesIcon className="size-4" />
          <span>
            AI insights are in beta for power users. Toggle the feature flag to
            surface tailored guidance for each application.
          </span>
        </div>
      ) : null}

      {hasMore ? (
        <div className="flex justify-center">
          <Button onClick={onLoadMore} variant="outline">
            Load more applications
          </Button>
        </div>
      ) : null}
    </div>
  );
}
