"use client";

import { useCallback, useMemo } from "react";
import { Bookmark, Share2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { CandidateLayout } from "@/components/layouts/CandidateLayout";
import { GigDetailContainer } from "@/components/gigs/detail/GigDetailContainer";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import type { GigDetail, GigListItem } from "@/types/gigs";

export interface GigDetailPageContentProps {
  gig: GigDetail;
  relatedGigs?: GigListItem[];
}

export function GigDetailPageContent({
  gig,
  relatedGigs = [],
}: GigDetailPageContentProps) {
  const router = useRouter();
  const { showToast } = useToast();

  const candidateNavItems = useMemo(
    () => [
      { href: "/app/gigs", label: "Browse gigs", active: true },
      { href: "/profile/applications", label: "My applications" },
      { href: "/profile/saved", label: "Saved gigs" },
    ],
    [],
  );

  const handleApply = useCallback(() => {
    router.push(`/app/gigs/${gig._id}/apply`);
  }, [gig._id, router]);

  const handleSave = useCallback(() => {
    showToast("Saved for later", "success");
  }, [showToast]);

  const handleShare = useCallback(async () => {
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";

    try {
      if (navigator.share) {
        await navigator.share({
          title: gig.title,
          text: gig.description,
          url: shareUrl,
        });
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      showToast("Link copied", "success");
    } catch (error) {
      const fallbackMessage =
        error instanceof Error ? error.message : "Unable to share right now.";
      showToast(fallbackMessage, "error");
    }
  }, [gig.description, gig.title, showToast]);

  const topActions = (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" onClick={handleApply}>
        Apply to this gig
      </Button>
      <Button variant="outline" size="sm" onClick={handleSave}>
        <Bookmark className="mr-2 h-4 w-4" /> Save
      </Button>
      <Button variant="ghost" size="sm" onClick={handleShare}>
        <Share2 className="mr-2 h-4 w-4" /> Share
      </Button>
    </div>
  );

  return (
    <CandidateLayout
      title={gig.title}
      description={gig.description}
      actions={topActions}
      navItems={candidateNavItems}
      contentClassName="mx-auto w-full max-w-3xl space-y-8 pb-24"
    >
      <GigDetailContainer
        gig={gig}
        relatedGigs={relatedGigs}
        onApply={handleApply}
        onSave={handleSave}
      />

      <div className="border-border bg-background/95 sticky right-0 bottom-6 left-0 z-20 rounded-2xl border p-4 shadow-xl backdrop-blur">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-foreground text-sm font-medium">
              Ready to make a move?
            </p>
            <p className="text-muted-foreground text-sm">
              Applying takes less than 5 minutes and keeps you top of mind with
              the employer.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button size="lg" onClick={handleApply}>
              Apply to this gig
            </Button>
            <Button variant="outline" size="lg" onClick={handleSave}>
              <Bookmark className="mr-2 h-5 w-5" /> Save for later
            </Button>
            <Button variant="ghost" size="lg" onClick={handleShare}>
              <Share2 className="mr-2 h-5 w-5" /> Share
            </Button>
          </div>
        </div>
      </div>
    </CandidateLayout>
  );
}
