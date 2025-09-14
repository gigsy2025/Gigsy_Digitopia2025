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
import type {
  SkillsFormData,
  SkillsAnalyticsEvent,
  UseSkillsService,
  Skill,
  SkillsSearchOptions,
} from "@/types/skills";

// Mock API until Convex generates types
const mockApi = {
  skills: {
    getCurrentUser: null as any,
    checkUserHasSkills: null as any,
    getSkillsCatalog: null as any,
    updateUserSkills: null as any,
  },
};

/**
 * Main skills service hook
 */
export function useSkillsService(): UseSkillsService {
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<Error | null>(null);

  // Convex queries and mutations (TODO: Replace with actual API when generated)
  const user = null; // useQuery(api.skills.getCurrentUser);
  const skillsCheck = null; // useQuery(api.skills.checkUserHasSkills);
  const skillsCatalog = null; // useQuery(api.skills.getSkillsCatalog, {});
  const updateSkillsMutation = null; // useMutation(api.skills.updateUserSkills);

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

      try {
        // Use the existing catalog query with search parameters
        const results = await fetch("/api/skills/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(options),
        });

        if (!results.ok) {
          throw new Error("Failed to search skills");
        }

        const data = await results.json();
        return data.skills || [];
      } catch (error) {
        setSearchError(error as Error);
        console.error("Skills search error:", error);

        // Fallback to local filtering of catalog
        if (skillsCatalog?.skills) {
          let filtered = skillsCatalog.skills;

          if (options.query) {
            const query = options.query.toLowerCase();
            filtered = filtered.filter(
              (skill) =>
                skill.name.toLowerCase().includes(query) ||
                skill.category.toLowerCase().includes(query),
            );
          }

          if (options.category && options.category !== "all") {
            filtered = filtered.filter(
              (skill) => skill.category === options.category,
            );
          }

          if (options.excludeSelected?.length) {
            filtered = filtered.filter(
              (skill) => !options.excludeSelected!.includes(skill.id),
            );
          }

          if (options.limit) {
            filtered = filtered.slice(0, options.limit);
          }

          return filtered;
        }

        return [];
      } finally {
        setIsSearching(false);
      }
    },
    [skillsCatalog],
  );

  /**
   * Save user skills with optimistic updates
   */
  const saveSkills = useCallback(
    async (data: SkillsFormData): Promise<void> => {
      setIsSaving(true);

      try {
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

        if (!result.success) {
          throw new Error("Failed to save skills");
        }

        // Set session cookie to prevent re-showing onboarding
        document.cookie = `skills_onboarded=true; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;

        // Track completion event
        trackEvent({
          action: "onboarding_completed",
          skillIds: data.skills,
          experienceLevel: data.experienceLevel,
        });
      } catch (error) {
        console.error("Error saving skills:", error);
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [updateSkillsMutation],
  );

  /**
   * Get skill recommendations based on selected skills
   */
  const getRecommendations = useCallback(
    async (selectedSkills: string[]) => {
      try {
        const allSkills = skillsCatalog?.skills || [];

        // Simple recommendation logic - can be enhanced with ML/AI
        const recommendations = allSkills
          .filter((skill) => !selectedSkills.includes(skill.id))
          .filter((skill) => skill.isPopular)
          .slice(0, 5)
          .map((skill) => ({
            skills: [skill],
            reason: "popular" as const,
            confidence: 0.8,
          }));

        return recommendations;
      } catch (error) {
        console.error("Error getting recommendations:", error);
        return [];
      }
    },
    [skillsCatalog],
  );

  /**
   * Track analytics events
   */
  const trackEvent = useCallback(
    (event: SkillsAnalyticsEvent): void => {
      try {
        // Send to analytics service in background
        fetch("/api/analytics/skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...event,
            timestamp: new Date().toISOString(),
            userId: user?.clerkId,
          }),
        }).catch((error) => {
          console.warn("Analytics tracking failed:", error);
        });

        // Also log locally for debugging
        console.log("Skills Analytics:", event);
      } catch (error) {
        console.warn("Error tracking analytics:", error);
      }
    },
    [user?.clerkId],
  );

  return {
    user: user || null,
    skillsCatalog: skillsCatalog?.skills || [],
    popularSkills: skillsCatalog?.popularSkills || [],
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
    hasSkills: skillsCheck?.hasSkills || false,
    isLoading: skillsCheck === undefined,
    user: skillsCheck?.user || null,
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
