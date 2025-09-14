/**
 * SKILLS CHECK COMPONENT
 *
 * Session-aware component that checks if user has skills configured
 * and shows onboarding modal when needed. Includes cookie management
 * to prevent repeated prompts and proper SSR support.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-14
 */

"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { SkillsOnboardingModal } from "./SkillsOnboardingModal";
import type { SkillsFormData } from "@/types/skills";

interface SkillsCheckProps {
  /** Custom callback when skills are saved */
  onSkillsSaved?: (data: SkillsFormData) => void;

  /** Custom callback when onboarding is skipped */
  onSkillsSkipped?: () => void;

  /** Override the session cookie check */
  forceShow?: boolean;
}

export function SkillsCheck({
  onSkillsSaved,
  onSkillsSkipped,
  forceShow = false,
}: SkillsCheckProps) {
  const { user, isLoaded } = useUser();
  const [showModal, setShowModal] = useState(false);
  const [hasSessionCookie, setHasSessionCookie] = useState(false);
  const [isCheckComplete, setIsCheckComplete] = useState(false);

  // Convex hooks for checking user skills and updating them
  const userSkillsStatus = useQuery(api.skills.checkUserHasSkills);
  const updateUserSkills = useMutation(api.skills.updateUserSkills);

  // Check for session cookie on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("skills_onboarded="));
      const cookieValue = cookie?.split("=")[1] === "true";
      setHasSessionCookie(cookieValue);
      setIsCheckComplete(true);
    }
  }, []);

  // Determine if we should show onboarding
  useEffect(() => {
    if (!isLoaded || !isCheckComplete) return;

    // Don't show if user is not authenticated
    if (!user) {
      setShowModal(false);
      return;
    }

    // Force show if explicitly requested
    if (forceShow) {
      setShowModal(true);
      return;
    }

    // Don't show if session cookie exists
    if (hasSessionCookie) {
      setShowModal(false);
      return;
    }

    // For demo purposes, we'll show the modal for all new sessions
    // Check Convex database for user skills
    const hasSkillsInProfile = userSkillsStatus?.hasSkills ?? false;

    if (!hasSkillsInProfile) {
      setShowModal(true);
    }
  }, [
    user,
    isLoaded,
    hasSessionCookie,
    isCheckComplete,
    forceShow,
    userSkillsStatus?.hasSkills,
  ]);

  // Handle skills completion
  const handleSkillsComplete = async (data: SkillsFormData) => {
    try {
      console.log("Skills selected:", data);

      // Save to Convex database
      await updateUserSkills({ skills: data.skills });

      // Set session cookie
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // 7 days
      document.cookie = `skills_onboarded=true; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;

      // Update local state
      setHasSessionCookie(true);
      setShowModal(false);

      // Call custom callback
      onSkillsSaved?.(data);

      // Analytics tracking (fire and forget)
      fetch("/api/analytics/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "onboarding_completed",
          skillIds: data.skills,
          userId: user?.id,
          timestamp: new Date().toISOString(),
        }),
      }).catch((error) => {
        console.warn("Analytics tracking failed:", error);
      });
    } catch (error) {
      console.error("Error completing skills onboarding:", error);
      // Could show toast notification here
    }
  };

  // Handle skip
  const handleSkip = () => {
    // Set session cookie for short duration to prevent immediate re-prompt
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 1); // 1 day
    document.cookie = `skills_onboarded=true; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;

    setHasSessionCookie(true);
    setShowModal(false);

    onSkillsSkipped?.();

    // Analytics tracking
    fetch("/api/analytics/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "onboarding_skipped",
        userId: user?.id,
        timestamp: new Date().toISOString(),
      }),
    }).catch((error) => {
      console.warn("Analytics tracking failed:", error);
    });
  };

  // Don't render anything if checks aren't complete
  if (!isCheckComplete || !isLoaded) {
    return null;
  }

  return (
    <SkillsOnboardingModal
      isOpen={showModal}
      onClose={() => setShowModal(false)}
      onComplete={handleSkillsComplete}
      onSkip={handleSkip}
      allowSkip={true}
    />
  );
}

/**
 * Hook for programmatically managing skills onboarding
 */
export function useSkillsOnboarding() {
  const [isOpen, setIsOpen] = useState(false);

  const showOnboarding = () => setIsOpen(true);
  const hideOnboarding = () => setIsOpen(false);

  const clearSession = () => {
    if (typeof window !== "undefined") {
      document.cookie =
        "skills_onboarded=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
    }
  };

  return {
    isOpen,
    showOnboarding,
    hideOnboarding,
    clearSession,
  };
}
