"use client";

import { useCallback, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

import { useGigDetailQuery } from "@/hooks/useGigData";
import { useToast } from "@/components/ui/use-toast";

export interface GigDetailController {
  gig: ReturnType<typeof useGigDetailQuery>["data"];
  status: ReturnType<typeof useGigDetailQuery>["status"];
  error: ReturnType<typeof useGigDetailQuery>["error"];
  refetch: ReturnType<typeof useGigDetailQuery>["refetch"];
  isLoading: boolean;
  hasFatalError: boolean;
  handleApply: () => void;
  handleSave: () => void;
  handleShare: () => Promise<void>;
}

export function useGigDetailPageController(gigId: string | null): GigDetailController {
  const router = useRouter();
  const { showToast } = useToast();

  useEffect(() => {
    if (!gigId) {
      router.replace("/app/gigs");
    }
  }, [gigId, router]);

  const {
    data: gig,
    status,
    error,
    refetch,
  } = useGigDetailQuery(gigId ?? "", {
    enabled: Boolean(gigId),
    debugLabel: "GigDetailPage",
  });

  useEffect(() => {
    if (!error) {
      return;
    }

    if (error.message.toLowerCase().includes("not found")) {
      router.replace("/app/gigs");
    }
  }, [error, router]);

  const handleApply = useCallback(() => {
    if (!gigId) {
      return;
    }
    router.push(`/app/gigs/${gigId}/apply`);
  }, [router, gigId]);

  const handleSave = useCallback(() => {
    if (!gig) {
      return;
    }
    showToast("Saved for later", "success");
  }, [gig, showToast]);

  const handleShare = useCallback(async () => {
    if (!gig) {
      return;
    }

    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const shareData: ShareData = {
      title: gig.title,
      text: gig.description,
      url: shareUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }

      await navigator.clipboard.writeText(shareUrl);
      showToast("Link copied", "success");
    } catch (shareError) {
      const fallbackMessage =
        shareError instanceof Error ? shareError.message : "Unable to share right now.";
      showToast(fallbackMessage, "error");
    }
  }, [gig, showToast]);

  const hasFatalError = useMemo(() => {
    if (status !== "error") {
      return false;
    }
    const message = error?.message.toLowerCase() ?? "";
    return !message.includes("not found");
  }, [status, error]);

  const isLoading = status === "loading" || !gigId;

  return {
    gig,
    status,
    error,
    refetch,
    isLoading,
    hasFatalError,
    handleApply,
    handleSave,
    handleShare,
  };
}
