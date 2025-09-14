/**
 * USER PERMISSIONS HOOK
 *
 * Centralized permission management for Gigsy platform with Clerk integration,
 * role-based access control, and feature flag management.
 *
 * SECURITY: Validates permissions on both client and server sides.
 * PERFORMANCE: Memoized computations with cache invalidation.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-14
 */

import { useMemo } from "react";
import { useUser } from "@clerk/nextjs";
import type { UserPermissions, UserRole, FeatureFlag } from "@/types/sidebar";

/**
 * Clerk user interface for type safety
 */
interface ClerkUser {
  publicMetadata?: {
    role?: string;
    additionalRoles?: string[];
    subscriptionTier?: string;
  };
  unsafeMetadata?: {
    role?: string;
    betaFeatures?: string[];
    customPermissions?: string[];
  };
  emailAddresses?: Array<{
    emailAddress?: string;
  }>;
}

/**
 * Feature flag configuration with environment-based overrides
 */
const FEATURE_FLAGS: Record<FeatureFlag, boolean> = {
  advanced_analytics:
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ENABLE_ADVANCED_ANALYTICS === "true",
  beta_chat_features:
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_ENABLE_BETA_CHAT === "true",
  gamification_v2: process.env.NEXT_PUBLIC_ENABLE_GAMIFICATION_V2 === "true",
  mentor_marketplace:
    process.env.NEXT_PUBLIC_ENABLE_MENTOR_MARKETPLACE === "true",
  enterprise_dashboard:
    process.env.NEXT_PUBLIC_ENABLE_ENTERPRISE_DASHBOARD === "true",
  mobile_notifications: true, // Generally available
  ai_recommendations:
    process.env.NEXT_PUBLIC_ENABLE_AI_RECOMMENDATIONS === "true",
};

/**
 * Extract user role from Clerk metadata with fallback logic
 */
function extractUserRole(user: ClerkUser | null): UserRole {
  if (!user) return "student";

  // Check public metadata first (set by admin)
  const publicRole = user.publicMetadata?.role;
  if (publicRole && isValidRole(publicRole)) {
    return publicRole;
  }

  // Check unsafe metadata (user-controlled, needs validation)
  const unsafeRole = user.unsafeMetadata?.role;
  if (unsafeRole && isValidRole(unsafeRole)) {
    return unsafeRole;
  }

  // Default fallback based on email domain or user type
  const primaryEmail = user.emailAddresses?.[0]?.emailAddress;
  if (primaryEmail?.endsWith("@gigsy.com")) {
    return "admin";
  }

  // Default to student for new users
  return "student";
}

/**
 * Validate if a string is a valid UserRole
 */
function isValidRole(role: string): role is UserRole {
  const validRoles: UserRole[] = [
    "student",
    "freelancer",
    "client",
    "mentor",
    "admin",
    "moderator",
  ];
  return validRoles.includes(role as UserRole);
}

/**
 * Extract multiple roles from user metadata (supports role hierarchies)
 */
function extractUserRoles(user: ClerkUser | null): UserRole[] {
  const primaryRole = extractUserRole(user);
  const additionalRoles = user?.publicMetadata?.additionalRoles ?? [];

  // Deduplicate and validate all roles
  const allRoles = [primaryRole, ...additionalRoles].filter(
    (role, index, array): role is UserRole =>
      array.indexOf(role) === index && isValidRole(role),
  );

  return allRoles;
}

/**
 * Get enabled feature flags for user based on role and subscription
 */
function getEnabledFeatureFlags(
  user: ClerkUser | null,
  roles: UserRole[],
): FeatureFlag[] {
  const enabledFlags: FeatureFlag[] = [];

  // Base flags available to all users
  const baseFlags: FeatureFlag[] = ["mobile_notifications"];
  enabledFlags.push(...baseFlags);

  // Role-based feature access
  if (roles.includes("admin") || roles.includes("moderator")) {
    enabledFlags.push("advanced_analytics", "enterprise_dashboard");
  }

  if (roles.includes("mentor")) {
    enabledFlags.push("mentor_marketplace");
  }

  if (roles.includes("freelancer") || roles.includes("client")) {
    enabledFlags.push("ai_recommendations");
  }

  // Subscription-based features
  const subscriptionTier = user?.publicMetadata?.subscriptionTier;
  if (subscriptionTier === "pro" || subscriptionTier === "enterprise") {
    enabledFlags.push("beta_chat_features", "gamification_v2");
  }

  // User-specific beta access
  const betaFeatures = user?.unsafeMetadata?.betaFeatures ?? [];
  const validBetaFeatures = betaFeatures.filter((flag): flag is FeatureFlag =>
    Object.keys(FEATURE_FLAGS).includes(flag),
  );
  enabledFlags.push(...validBetaFeatures);

  // Filter by globally enabled flags and deduplicate
  return enabledFlags
    .filter((flag) => FEATURE_FLAGS[flag])
    .filter((flag, index, array) => array.indexOf(flag) === index);
}

/**
 * Main hook for user permissions management
 *
 * @returns UserPermissions object with roles, flags, and subscription info
 */
export function useUserPermissions(): UserPermissions & {
  isLoading: boolean;
  error: Error | null;
} {
  const { user, isLoaded, isSignedIn } = useUser();

  return useMemo(() => {
    // Loading state
    if (!isLoaded) {
      return {
        roles: ["student"], // Safe default
        enabledFlags: ["mobile_notifications"], // Basic features only
        subscriptionTier: "free",
        customPermissions: [],
        isLoading: true,
        error: null,
      };
    }

    // Not signed in - guest permissions
    if (!isSignedIn || !user) {
      return {
        roles: ["student"],
        enabledFlags: ["mobile_notifications"],
        subscriptionTier: "free",
        customPermissions: [],
        isLoading: false,
        error: null,
      };
    }

    try {
      // Cast user to our interface for type safety
      const clerkUser = user as unknown as ClerkUser;

      // Extract user data
      const roles = extractUserRoles(clerkUser);
      const enabledFlags = getEnabledFeatureFlags(clerkUser, roles);
      const subscriptionTier =
        (clerkUser.publicMetadata?.subscriptionTier as
          | "free"
          | "pro"
          | "enterprise") ?? "free";
      const customPermissions =
        clerkUser.unsafeMetadata?.customPermissions ?? [];

      return {
        roles,
        enabledFlags,
        subscriptionTier,
        customPermissions,
        isLoading: false,
        error: null,
      };
    } catch (error) {
      console.error("Error extracting user permissions:", error);

      // Fallback to safe defaults on error
      return {
        roles: ["student"],
        enabledFlags: ["mobile_notifications"],
        subscriptionTier: "free",
        customPermissions: [],
        isLoading: false,
        error:
          error instanceof Error
            ? error
            : new Error("Unknown permissions error"),
      };
    }
  }, [user, isLoaded, isSignedIn]);
}

/**
 * Permission checking utilities
 */
export const PermissionUtils = {
  /**
   * Check if user has any of the required roles
   */
  hasAnyRole: (userRoles: UserRole[], requiredRoles: UserRole[]): boolean => {
    if (requiredRoles.length === 0) return true;
    return requiredRoles.some((role) => userRoles.includes(role));
  },

  /**
   * Check if user has all required feature flags
   */
  hasAllFlags: (
    userFlags: FeatureFlag[],
    requiredFlags: FeatureFlag[],
  ): boolean => {
    if (requiredFlags.length === 0) return true;
    return requiredFlags.every((flag) => userFlags.includes(flag));
  },

  /**
   * Check if user can access a navigation item
   */
  canAccessItem: (
    userPermissions: UserPermissions,
    requiredRoles: UserRole[] = [],
    requiredFlags: FeatureFlag[] = [],
  ): boolean => {
    const hasRole = PermissionUtils.hasAnyRole(
      userPermissions.roles,
      requiredRoles,
    );
    const hasFlags = PermissionUtils.hasAllFlags(
      userPermissions.enabledFlags,
      requiredFlags,
    );
    return hasRole && hasFlags;
  },

  /**
   * Get highest priority role for display purposes
   */
  getPrimaryRole: (roles: UserRole[]): UserRole => {
    const rolePriority: Record<UserRole, number> = {
      admin: 6,
      moderator: 5,
      mentor: 4,
      client: 3,
      freelancer: 2,
      student: 1,
    };

    return roles.reduce(
      (highest, current) =>
        rolePriority[current] > rolePriority[highest] ? current : highest,
      roles[0] ?? "student",
    );
  },
};
