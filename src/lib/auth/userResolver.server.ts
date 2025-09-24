/**
 * USER METADATA RESOLVER (SERVER-SIDE)
 *
 * Server-side utility for fetching and normalizing Clerk user metadata.
 * Provides secure, validated user profile data with proper error handling.
 *
 * SECURITY PRINCIPLES:
 * - All validation happens server-side
 * - Graceful fallback to "guest" role for invalid data
 * - Audit logging for security analysis
 * - Never expose private metadata to client
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-14
 */

import { currentUser, type User } from "@clerk/nextjs/server";
import {
  type Role,
  type UserProfile,
  type UserPublicMetadata,
  isValidRole,
  isValidUserMetadata,
} from "@/types/auth";

/**
 * Error types for user resolution
 */
export class UserResolutionError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly userId?: string,
  ) {
    super(message);
    this.name = "UserResolutionError";
  }
}

/**
 * Fetch and normalize current user from Clerk
 *
 * @returns Promise<UserProfile | null> - Normalized user profile or null if not authenticated
 * @throws UserResolutionError - If user data is corrupted or invalid
 */
export async function resolveCurrentUser(): Promise<UserProfile | null> {
  try {
    const user = await currentUser();

    if (!user) {
      return null;
    }

    return normalizeUserProfile(user);
  } catch (error) {
    console.error("[UserResolver] Failed to resolve current user:", {
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    // Re-throw as UserResolutionError for proper handling
    if (error instanceof UserResolutionError) {
      throw error;
    }

    throw new UserResolutionError(
      "Failed to resolve user profile",
      "RESOLUTION_FAILED",
    );
  }
}

/**
 * Normalize Clerk user into our UserProfile structure
 *
 * @param user - Clerk User object
 * @returns UserProfile - Normalized and validated user profile
 */
export function normalizeUserProfile(user: User): UserProfile {
  try {
    // Validate and extract public metadata
    const publicMetadata = user.publicMetadata || {};

    if (!isValidUserMetadata(publicMetadata)) {
      console.warn("[UserResolver] Invalid metadata structure detected:", {
        userId: user.id,
        metadata: publicMetadata,
        timestamp: new Date().toISOString(),
      });

      // Use fallback metadata for corrupted data
      const fallbackMetadata: UserPublicMetadata = {
        role: "guest",
        verified: false,
      };

      return buildUserProfile(user, fallbackMetadata);
    }

    return buildUserProfile(user, publicMetadata as UserPublicMetadata);
  } catch (error) {
    console.error("[UserResolver] Failed to normalize user profile:", {
      userId: user.id,
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });

    throw new UserResolutionError(
      "Failed to normalize user profile",
      "NORMALIZATION_FAILED",
      user.id,
    );
  }
}

/**
 * Build UserProfile from Clerk user and validated metadata
 *
 * @param user - Clerk User object
 * @param metadata - Validated public metadata
 * @returns UserProfile - Complete user profile
 */
function buildUserProfile(
  user: User,
  metadata: UserPublicMetadata,
): UserProfile {
  // Validate and normalize role
  const role = normalizeRole(metadata.role, user.id);

  // Get primary email address
  const primaryEmail = user.emailAddresses.find(
    (email) => email.id === user.primaryEmailAddressId,
  );

  const displayName =
    user.fullName ??
    [user.firstName, user.lastName].filter(Boolean).join(" ") ??
    undefined;

  return {
    id: user.id,
    email: primaryEmail?.emailAddress,
    name: displayName,
    username: user.username ?? undefined,
    firstName: user.firstName ?? undefined,
    lastName: user.lastName ?? undefined,
    avatar: user.imageUrl,
    role,
    verified: metadata.verified ?? false,
    organizationId: metadata.organizationId,
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Normalize and validate role with security logging
 *
 * @param role - Raw role value from metadata
 * @param userId - User ID for audit logging
 * @returns Role - Validated role (defaults to "guest")
 */
function normalizeRole(role: unknown, userId: string): Role {
  if (isValidRole(role)) {
    return role;
  }

  // Log invalid role attempts for security analysis
  if (role !== undefined) {
    console.warn("[UserResolver] Invalid role detected:", {
      userId,
      invalidRole: role,
      fallbackRole: "guest",
      timestamp: new Date().toISOString(),
      // Include request context if available
      userAgent:
        typeof window !== "undefined" ? window.navigator.userAgent : "server",
    });
  }

  return "guest";
}

/**
 * Check if user has minimum required role
 *
 * @param userRole - Current user role
 * @param requiredRole - Minimum required role
 * @returns boolean - True if user has sufficient permissions
 */
export function hasMinimumRole(userRole: Role, requiredRole: Role): boolean {
  const roleHierarchy: Record<Role, number> = {
    guest: 0,
    student: 1,
    employer: 2,
    admin: 3,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

/**
 * Get user-specific cache key for caching strategies
 *
 * @param userId - User ID
 * @returns string - Cache key
 */
export function getUserCacheKey(userId: string): string {
  return `user:profile:${userId}`;
}

/**
 * Validate if a user profile is still fresh
 *
 * @param profile - User profile to check
 * @param maxAgeMs - Maximum age in milliseconds (default: 5 minutes)
 * @returns boolean - True if profile is still fresh
 */
export function isProfileFresh(
  profile: UserProfile,
  maxAgeMs: number = 5 * 60 * 1000,
): boolean {
  const fetchedAt = new Date(profile.fetchedAt).getTime();
  const now = Date.now();

  return now - fetchedAt < maxAgeMs;
}
