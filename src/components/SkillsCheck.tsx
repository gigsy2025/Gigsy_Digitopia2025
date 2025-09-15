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
import { useApiLogger, useUserActionLogger } from "@/lib/logging/hooks";
import { createPerformanceTracker } from "@/lib/logging/utils";

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

  // Enterprise logging hooks
  const { logAction } = useUserActionLogger("skills-onboarding");
  const { logApiCall } = useApiLogger();

  // Check for session cookie on mount
  useEffect(() => {
    const initializeCookieCheck = async () => {
      await logAction("skills-check-initialization", {
        timestamp: new Date().toISOString(),
        source: "SkillsCheck",
        operation: "cookie-check",
        environment: typeof window !== "undefined" ? "browser" : "server",
      });

      if (typeof window !== "undefined") {
        const cookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("skills_onboarded="));
        const cookieValue = cookie?.split("=")[1] === "true";

        await logAction("session-cookie-checked", {
          cookieExists: !!cookie,
          cookieValue,
          timestamp: new Date().toISOString(),
        });

        setHasSessionCookie(cookieValue);
        setIsCheckComplete(true);

        console.log("🍪 Session cookie check completed:", {
          cookieExists: !!cookie,
          cookieValue,
        });
      }
    };

    void initializeCookieCheck();
  }, [logAction]);

  // Determine if we should show onboarding
  useEffect(() => {
    const evaluateOnboardingDisplay = async () => {
      if (!isLoaded || !isCheckComplete) {
        await logAction("onboarding-evaluation-pending", {
          isLoaded,
          isCheckComplete,
          timestamp: new Date().toISOString(),
        });
        return;
      }

      await logAction("onboarding-evaluation-started", {
        isLoaded,
        isCheckComplete,
        userAuthenticated: !!user,
        forceShow,
        hasSessionCookie,
        userSkillsStatus: userSkillsStatus?.hasSkills,
        timestamp: new Date().toISOString(),
      });

      // Don't show if user is not authenticated
      if (!user) {
        await logAction("onboarding-skipped-no-auth", {
          reason: "user_not_authenticated",
          timestamp: new Date().toISOString(),
        });
        setShowModal(false);
        return;
      }

      // Force show if explicitly requested
      if (forceShow) {
        await logAction("onboarding-force-shown", {
          reason: "force_show_requested",
          timestamp: new Date().toISOString(),
        });
        setShowModal(true);
        return;
      }

      // Don't show if session cookie exists
      if (hasSessionCookie) {
        await logAction("onboarding-skipped-cookie-exists", {
          reason: "session_cookie_exists",
          timestamp: new Date().toISOString(),
        });
        setShowModal(false);
        return;
      }

      // Check Convex database for user skills
      const hasSkillsInProfile = userSkillsStatus?.hasSkills ?? false;

      await logAction("onboarding-decision-made", {
        hasSkillsInProfile,
        willShowModal: !hasSkillsInProfile,
        userSkillsStatus: userSkillsStatus,
        timestamp: new Date().toISOString(),
        decisionFactors: {
          userAuthenticated: !!user,
          forceShow,
          hasSessionCookie,
          hasSkillsInProfile,
        },
      });

      if (!hasSkillsInProfile) {
        await logAction("onboarding-modal-shown", {
          reason: "no_skills_in_profile",
          timestamp: new Date().toISOString(),
        });
        setShowModal(true);
        console.log(
          "🎯 Skills onboarding modal will be shown - no skills in profile",
        );
      } else {
        console.log("✅ Skills onboarding not needed - user has skills");
      }
    };

    void evaluateOnboardingDisplay();
  }, [
    user,
    isLoaded,
    hasSessionCookie,
    isCheckComplete,
    forceShow,
    userSkillsStatus,
    logAction,
  ]);

  // Handle skills completion
  const handleSkillsComplete = async (data: SkillsFormData) => {
    // Clear any previous errors and log the start of the operation
    await logAction("skills-onboarding-started", {
      skillsCount: data.skills.length,
      skillIds: data.skills,
      timestamp: new Date().toISOString(),
      source: "SkillsCheck",
      operation: "skills-completion",
    });

    console.log("🚀 Skills onboarding process initiated:", {
      skillsSelected: data.skills.length,
      skills: data.skills,
    });

    // Start performance tracking for the entire skills completion operation
    const performanceTracker = createPerformanceTracker(
      "skills-onboarding",
      "complete-skills-operation",
    );

    console.log("📊 Performance tracking started for skills completion");

    try {
      console.log("Skills selected:", data);

      // Log the start of Convex database operation
      await logAction("convex-mutation-started", {
        operation: "updateUserSkills",
        skillsCount: data.skills.length,
        timestamp: new Date().toISOString(),
      });

      // Save to Convex database with timing
      const convexStartTime = performance.now();
      await updateUserSkills({ skills: data.skills });
      const convexDuration = performance.now() - convexStartTime;

      // Log the successful Convex API call
      await logApiCall(
        "MUTATION",
        "convex/skills.updateUserSkills",
        convexDuration,
        200, // Success status
        undefined, // No error
        {
          skillsCount: data.skills.length,
          skillIds: data.skills,
          operationType: "database-mutation",
          requestPayload: {
            skills: data.skills,
          },
        },
      );

      console.log("✅ Convex mutation completed successfully:", {
        duration: `${convexDuration.toFixed(2)}ms`,
        skillsUpdated: data.skills.length,
      });

      // Set session cookie with logging
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // 7 days
      document.cookie = `skills_onboarded=true; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;

      await logAction("session-cookie-set", {
        expiryDays: 7,
        cookieName: "skills_onboarded",
        timestamp: new Date().toISOString(),
      });

      // Update local state
      setHasSessionCookie(true);
      setShowModal(false);

      // Call custom callback
      onSkillsSaved?.(data);

      // Log successful skills save operation
      await logAction("skills-saved-successfully", {
        operation: "skills-completion",
        status: "success",
        skillsCount: data.skills.length,
        skillIds: data.skills,
        convexDuration,
        userId: user?.id,
        timestamp: new Date().toISOString(),
        metadata: {
          sessionCookieSet: true,
          modalClosed: true,
          callbackExecuted: !!onSkillsSaved,
        },
      });

      console.log(
        `✅ Successfully saved ${data.skills.length} skills to user profile`,
      );

      // Analytics tracking with enhanced context (fire and forget)
      const analyticsStartTime = performance.now();
      fetch("/api/logging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: "info",
          message: "Skills onboarding completed successfully",
          context: {
            feature: "skills-analytics",
            action: "onboarding_completed",
            skillIds: data.skills,
            skillsCount: data.skills.length,
            userId: user?.id,
            timestamp: new Date().toISOString(),
            source: "SkillsCheck",
            performanceMetrics: {
              convexDuration,
              totalOperationTime: performance.now() - convexStartTime,
            },
            sessionData: {
              userAgent: navigator.userAgent,
              url: window.location.href,
              cookieSet: true,
            },
          },
        }),
      })
        .then(async (response) => {
          const analyticsDuration = performance.now() - analyticsStartTime;
          await logApiCall(
            "POST",
            "/api/logging",
            analyticsDuration,
            response.status,
            response.ok
              ? undefined
              : new Error(`Analytics API Error: ${response.status}`),
            {
              operationType: "analytics-tracking",
              responseSize: JSON.stringify(await response.json()).length,
              correlationId: `skills-${Date.now()}`,
            },
          );
        })
        .catch(async (error) => {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown analytics error";
          console.warn("Analytics tracking failed:", error);
          await logAction("analytics-tracking-failed", {
            error: errorMessage,
            timestamp: new Date().toISOString(),
          });
        });

      // Finish performance tracking with success
      await performanceTracker.finish(true, undefined, {
        operationsCompleted: 3, // Convex mutation, cookie set, analytics
        skillsProcessed: data.skills.length,
        convexDuration,
        totalApiCalls: 2, // Convex + Analytics
        sessionManagement: "success",
        userCallbackExecuted: !!onSkillsSaved,
      });

      console.log("🎉 Skills onboarding completed successfully:", {
        skillsCount: data.skills.length,
        convexDuration: `${convexDuration.toFixed(2)}ms`,
        sessionCookieSet: true,
        modalClosed: true,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      console.error("❌ Skills onboarding failed:", error);

      // Log the error with comprehensive context
      await logAction("skills-completion-error", {
        operation: "skills-completion",
        status: "error",
        errorMessage,
        errorType:
          error instanceof Error ? error.constructor.name : "UnknownError",
        skillsAttempted: data.skills.length,
        skillIds: data.skills,
        userId: user?.id,
        timestamp: new Date().toISOString(),
        errorDetails: {
          stack: error instanceof Error ? error.stack : undefined,
          convexOperation: "updateUserSkills",
        },
      });

      // Log the failed API call
      await logApiCall(
        "MUTATION",
        "convex/skills.updateUserSkills",
        0, // No duration since it failed
        500, // Error status
        error as Error,
        {
          skillsCount: data.skills.length,
          operationType: "database-mutation-failed",
          requestPayload: {
            skills: data.skills,
          },
        },
      );

      // Finish performance tracking with error
      await performanceTracker.finish(false, error as Error, {
        operationFailed: true,
        errorMessage,
        skillsAttempted: data.skills.length,
        failurePoint: "convex-mutation",
      });

      // Could show toast notification here - keeping original comment
      console.error("Error completing skills onboarding:", error);
    }
  };

  // Handle skip
  const handleSkip = async () => {
    // Log the start of skip operation
    await logAction("skills-onboarding-skipped-started", {
      timestamp: new Date().toISOString(),
      source: "SkillsCheck",
      operation: "skip-onboarding",
      userId: user?.id,
    });

    console.log("⏭️ User initiated skills onboarding skip");

    // Start performance tracking for skip operation
    const performanceTracker = createPerformanceTracker(
      "skills-onboarding",
      "skip-operation",
    );

    try {
      // Set session cookie for short duration to prevent immediate re-prompt
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 1); // 1 day
      document.cookie = `skills_onboarded=true; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;

      // Log session cookie management
      await logAction("session-cookie-set-skip", {
        expiryDays: 1,
        cookieName: "skills_onboarded",
        reason: "user_skipped_onboarding",
        timestamp: new Date().toISOString(),
      });

      // Update local state
      setHasSessionCookie(true);
      setShowModal(false);

      // Call custom callback
      onSkillsSkipped?.();

      // Log successful skip operation
      await logAction("skills-onboarding-skipped-successfully", {
        operation: "skip-onboarding",
        status: "success",
        userId: user?.id,
        timestamp: new Date().toISOString(),
        metadata: {
          sessionCookieSet: true,
          modalClosed: true,
          callbackExecuted: !!onSkillsSkipped,
          skipDuration: 1, // days
        },
      });

      console.log("✅ Skills onboarding skip completed successfully");

      // Analytics tracking with skip context (fire and forget)
      const analyticsStartTime = performance.now();
      fetch("/api/logging", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          level: "info",
          message: "Skills onboarding skipped by user",
          context: {
            feature: "skills-analytics",
            action: "onboarding_skipped",
            userId: user?.id,
            timestamp: new Date().toISOString(),
            source: "SkillsCheck",
            skipMetadata: {
              skipDuration: "1_day",
              modalState: "closed",
              cookieSet: true,
            },
            sessionData: {
              userAgent: navigator.userAgent,
              url: window.location.href,
            },
          },
        }),
      })
        .then(async (response) => {
          const analyticsDuration = performance.now() - analyticsStartTime;
          await logApiCall(
            "POST",
            "/api/logging",
            analyticsDuration,
            response.status,
            response.ok
              ? undefined
              : new Error(`Analytics API Error: ${response.status}`),
            {
              operationType: "analytics-tracking-skip",
              correlationId: `skip-${Date.now()}`,
            },
          );
        })
        .catch(async (error) => {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown analytics error";
          console.warn("Skip analytics tracking failed:", error);
          await logAction("skip-analytics-tracking-failed", {
            error: errorMessage,
            timestamp: new Date().toISOString(),
          });
        });

      // Finish performance tracking with success
      await performanceTracker.finish(true, undefined, {
        operationType: "skip-onboarding",
        operationsCompleted: 2, // Cookie set, analytics
        sessionManagement: "success",
        skipDuration: "1_day",
        userCallbackExecuted: !!onSkillsSkipped,
      });

      console.log("🎯 Skills onboarding skip operation completed:", {
        cookieSet: true,
        modalClosed: true,
        skipDuration: "1 day",
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";

      console.error("❌ Skills onboarding skip failed:", error);

      // Log the skip error
      await logAction("skills-onboarding-skip-error", {
        operation: "skip-onboarding",
        status: "error",
        errorMessage,
        errorType:
          error instanceof Error ? error.constructor.name : "UnknownError",
        userId: user?.id,
        timestamp: new Date().toISOString(),
        errorDetails: {
          stack: error instanceof Error ? error.stack : undefined,
          operation: "skip-handling",
        },
      });

      // Finish performance tracking with error
      await performanceTracker.finish(false, error as Error, {
        operationFailed: true,
        errorMessage,
        failurePoint: "skip-operation",
      });

      console.error("Error during skills onboarding skip:", error);
    }
  };

  // Don't render anything if checks aren't complete
  if (!isCheckComplete || !isLoaded) {
    // Log the waiting state for debugging
    console.log("⏳ SkillsCheck waiting for initialization:", {
      isCheckComplete,
      isLoaded,
    });
    return null;
  }

  // Log the final render decision
  console.log("🎨 SkillsCheck rendering modal:", {
    showModal,
    hasSessionCookie,
    userAuthenticated: !!user,
  });

  return (
    <SkillsOnboardingModal
      isOpen={showModal}
      onClose={() => {
        setShowModal(false);
        void logAction("modal-closed-by-user", {
          timestamp: new Date().toISOString(),
          source: "modal-close-button",
        });
      }}
      onComplete={handleSkillsComplete}
      onSkip={handleSkip}
      allowSkip={true}
    />
  );
}

/**
 * Hook for programmatically managing skills onboarding with enterprise logging
 */
export function useSkillsOnboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const { logAction } = useUserActionLogger("skills-onboarding-hook");

  const showOnboarding = async () => {
    await logAction("programmatic-onboarding-shown", {
      timestamp: new Date().toISOString(),
      source: "useSkillsOnboarding",
      operation: "show",
    });
    console.log("📖 Programmatic skills onboarding shown");
    setIsOpen(true);
  };

  const hideOnboarding = async () => {
    await logAction("programmatic-onboarding-hidden", {
      timestamp: new Date().toISOString(),
      source: "useSkillsOnboarding",
      operation: "hide",
    });
    console.log("📖 Programmatic skills onboarding hidden");
    setIsOpen(false);
  };

  const clearSession = async () => {
    await logAction("session-cleared-programmatically", {
      timestamp: new Date().toISOString(),
      source: "useSkillsOnboarding",
      operation: "clear-session",
    });

    if (typeof window !== "undefined") {
      document.cookie =
        "skills_onboarded=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";

      await logAction("session-cookie-cleared", {
        cookieName: "skills_onboarded",
        timestamp: new Date().toISOString(),
      });

      console.log("🗑️ Skills onboarding session cookie cleared");
    }
  };

  return {
    isOpen,
    showOnboarding,
    hideOnboarding,
    clearSession,
  };
}
