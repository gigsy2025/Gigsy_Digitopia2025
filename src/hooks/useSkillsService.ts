/**
 * SKILLS SERVICE HOOK
 *
 * React hook providing comprehensive skills management with Convex integration,
 * optimistic updates, error handling, and analytics tracking.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-14
 */

"use client";

import React, { useCallback, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import type {
  SkillsFormData,
  SkillsAnalyticsEvent,
  UseSkillsService,
  Skill,
  SkillsSearchOptions,
} from "@/types/skills";
import { useEnterpriseLogger, useUserActionLogger } from "@/lib/logging/hooks";
import { createPerformanceTracker } from "@/lib/logging/utils";

// Types are now provided by Convex through the generated api import

/**
 * Main skills service hook
 */
export function useSkillsService(): UseSkillsService {
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<Error | null>(null);

  // Gigsy enterprise logging hooks
  const logger = useEnterpriseLogger({
    business: { feature: "skills-management", action: "service-hook" },
  });
  const { logAction } = useUserActionLogger("skills-management");

  // Convex queries and mutations
  const user = useQuery(api.skills.getCurrentUser);
  const skillsCheck = useQuery(api.skills.checkUserHasSkills);
  const skillsCatalog = useQuery(api.skills.getSkillsCatalog, {});
  const updateSkillsMutation = useMutation(api.skills.updateUserSkills);

  // Loading states
  const isLoading =
    user === undefined ||
    skillsCheck === undefined ||
    skillsCatalog === undefined;
  const [isSaving, setIsSaving] = useState(false);

  /**
   * Search skills with filtering options
   */
  const searchSkills = useCallback(
    async (options: SkillsSearchOptions): Promise<Skill[]> => {
      setIsSearching(true);
      setSearchError(null);

      // Start performance tracking like ButtonFetcher
      const performanceTracker = createPerformanceTracker(
        "skills-management",
        "search-skills",
      );

      try {
        await logAction("skills-search-start", {
          searchQuery: options.query,
          category: options.category,
          limit: options.limit,
        });

        // Use Convex catalog directly instead of non-existent API endpoint
        if (!skillsCatalog?.skills) {
          throw new Error("Skills catalog not available");
        }

        let filtered = skillsCatalog.skills;

        if (options.query) {
          const query = options.query.toLowerCase();
          filtered = filtered.filter(
            (skill: Skill) =>
              skill.name.toLowerCase().includes(query) ||
              skill.category.toLowerCase().includes(query),
          );
        }

        if (options.category && options.category !== "all") {
          filtered = filtered.filter(
            (skill: Skill) => skill.category === options.category,
          );
        }

        if (options.excludeSelected?.length) {
          filtered = filtered.filter(
            (skill: Skill) => !options.excludeSelected!.includes(skill.id),
          );
        }

        if (options.limit) {
          filtered = filtered.slice(0, options.limit);
        }

        await logAction("skills-search-success", {
          resultCount: filtered.length,
          searchDuration: 0, // Local filtering is instant
          fallbackUsed: false,
        });

        // Finish performance tracking with success
        await performanceTracker.finish(true, undefined, {
          resultCount: filtered.length,
          searchDuration: 0,
          localFiltering: true,
        });

        return filtered;
      } catch (error) {
        setSearchError(error as Error);

        await logger.error("Skills search failed", error as Error, {
          custom: {
            searchOptions: options,
          },
        });

        // Finish performance tracking with error
        await performanceTracker.finish(false, error as Error, {
          searchFailed: true,
        });

        return [];
      } finally {
        setIsSearching(false);
      }
    },
    [skillsCatalog, logAction, logger],
  );

  /**
   * Track analytics events
   */
  const trackEvent = useCallback(
    (event: SkillsAnalyticsEvent): void => {
      // Handle async operations in background like ButtonFetcher
      void (async () => {
        try {
          // Use the existing logging endpoint like ButtonFetcher
          const analyticsPromise = fetch("/api/logging", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              level: "info",
              message: `Skills analytics: ${event.action}`,
              context: {
                feature: "skills-analytics",
                action: event.action,
                skillIds: event.skillIds,
                experienceLevel: event.experienceLevel,
                userId: user?.clerkId,
                timestamp: new Date().toISOString(),
                source: "useSkillsService",
              },
            }),
          });

          // Handle analytics result properly like ButtonFetcher
          analyticsPromise.catch(async (error) => {
            await logger.warn("Analytics tracking failed", {
              custom: {
                analyticsEvent: event,
                error: error instanceof Error ? error.message : "Unknown error",
              },
            });
          });

          // Log analytics event using enterprise logging (await properly)
          await logger.info("Skills analytics event tracked", {
            custom: {
              action: event.action,
              skillCount: event.skillIds?.length,
              experienceLevel: event.experienceLevel,
              userId: user?.clerkId,
            },
          });
        } catch (error) {
          await logger.warn("Error tracking analytics", {
            custom: {
              analyticsEvent: event,
              error: error instanceof Error ? error.message : "Unknown error",
            },
          });
        }
      })();
    },
    [user?.clerkId, logger],
  );

  /**
   * Save user skills with optimistic updates
   */
  const saveSkills = useCallback(
    async (data: SkillsFormData): Promise<void> => {
      setIsSaving(true);

      try {
        await logAction("skills-save-start", {
          skillCount: data.skills.length,
          experienceLevel: data.experienceLevel,
        });

        // Track analytics event
        // Track analytics event
        trackEvent({
          action: "skill_selected",
          skillIds: data.skills,
          experienceLevel: data.experienceLevel,
        });

        // Call Convex mutation
        const result = await updateSkillsMutation({
          skills: data.skills,
        });

        if (!result?.success) {
          throw new Error("Failed to save skills");
        }

        await logAction("skills-save-success", {
          skillCount: data.skills.length,
          experienceLevel: data.experienceLevel,
        });

        // Set session cookie to prevent re-showing onboarding
        document.cookie = `skills_onboarded=true; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

        // Track completion event
        // Track analytics event
        trackEvent({
          action: "onboarding_completed",
          skillIds: data.skills,
          experienceLevel: data.experienceLevel,
        });

        await logAction("skills-onboarding-completed", {
          skillCount: data.skills.length,
          experienceLevel: data.experienceLevel,
        });
      } catch (error) {
        await logger.error("Error saving skills", error as Error, {
          custom: {
            skillCount: data.skills.length,
            experienceLevel: data.experienceLevel,
          },
        });
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [updateSkillsMutation, logAction, logger, trackEvent],
  );

  /**
   * Get skill recommendations based on selected skills
   */
  const getRecommendations = useCallback(
    async (selectedSkills: string[]) => {
      try {
        await logAction("skills-recommendations-request", {
          selectedSkillCount: selectedSkills.length,
        });

        const allSkills = skillsCatalog?.skills ?? [];

        // Simple recommendation logic - can be enhanced with ML/AI
        const recommendations = allSkills
          .filter((skill: Skill) => !selectedSkills.includes(skill.id))
          .filter((skill: Skill) => skill.isPopular)
          .slice(0, 5)
          .map((skill: Skill) => ({
            skills: [skill],
            reason: "popular" as const,
            confidence: 0.8,
          }));

        await logAction("skills-recommendations-success", {
          selectedSkillCount: selectedSkills.length,
          recommendationCount: recommendations.length,
        });

        return recommendations;
      } catch (error) {
        await logger.error(
          "Error getting skill recommendations",
          error as Error,
          {
            custom: {
              selectedSkillCount: selectedSkills.length,
            },
          },
        );
        return [];
      }
    },
    [skillsCatalog, logAction, logger],
  );

  return {
    user: user ?? null,
    skillsCatalog: skillsCatalog?.skills ?? [],
    popularSkills: skillsCatalog?.popularSkills ?? [],
    isLoading: isLoading || isSearching,
    isSaving,
    error: searchError,
    searchSkills,
    saveSkills,
    getRecommendations,
    trackEvent,
  };
}

/**
 * Hook specifically for checking if skills onboarding should be shown
 */
export function useSkillsCheck() {
  const skillsCheck = useQuery(api.skills.checkUserHasSkills);
  const [hasSessionCookie, setHasSessionCookie] = useState(false);

  // Check for session cookie on mount
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const cookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("skills_onboarded="));
      setHasSessionCookie(cookie?.split("=")[1] === "true");
    }
  }, []);

  return {
    shouldShowOnboarding:
      skillsCheck?.shouldShowOnboarding && !hasSessionCookie,
    hasSkills: skillsCheck?.hasSkills ?? false,
    isLoading: skillsCheck === undefined,
    user: skillsCheck?.user ?? null,
    hasSessionCookie,
  };
}

/**
 * Utility hook for managing session cookies
 */
export function useSkillsSession() {
  const setOnboardingComplete = useCallback(() => {
    if (typeof window !== "undefined") {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7); // 7 days

      document.cookie = `skills_onboarded=true; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
    }
  }, []);

  const clearOnboardingSession = useCallback(() => {
    if (typeof window !== "undefined") {
      document.cookie =
        "skills_onboarded=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax";
    }
  }, []);

  const hasOnboardingSession = useCallback(() => {
    if (typeof window === "undefined") return false;

    const cookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("skills_onboarded="));
    return cookie?.split("=")[1] === "true";
  }, []);

  return {
    setOnboardingComplete,
    clearOnboardingSession,
    hasOnboardingSession,
  };
}

// Add React import for useEffect
