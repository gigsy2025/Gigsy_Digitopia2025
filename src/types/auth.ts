/**
 * AUTHENTICATION AND AUTHORIZATION TYPES
 *
 * Type definitions for Clerk integration, user roles, and RBAC system.
 * Provides strong TypeScript safety for user metadata and authorization.
 *
 * SECURITY NOTES:
 * - Role validation must always happen server-side
 * - Client-side context is for UI convenience only
 * - All sensitive operations must re-validate permissions
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-14
 */

/**
 * Available user roles in the system
 * Maps to Clerk publicMetadata.role field
 */
export type Role = "student" | "employer" | "admin" | "guest";

/**
 * Clerk public metadata structure
 * Only include data that can be safely exposed to client
 */
export interface UserPublicMetadata {
  /** User role for RBAC */
  role?: Role;
  /** User verification status */
  verified?: boolean;
  /** Organization/company association */
  organizationId?: string;
  /** Feature flags for the user */
  featureFlags?: Record<string, boolean>;
}

/**
 * Normalized user profile for client consumption
 * Derived from Clerk user data and metadata
 */
export interface UserProfile {
  /** Clerk user ID */
  id: string;
  /** Primary email address */
  email?: string;
  /** Full display name */
  name?: string;
  /** User's avatar URL */
  avatar?: string;
  /** Normalized role (never undefined) */
  role: Role;
  /** Verification status */
  verified: boolean;
  /** Organization association */
  organizationId?: string;
  /** When this profile was fetched (for cache/debug) */
  fetchedAt: string;
}

/**
 * User context value structure
 * Minimal interface for React Context
 */
export interface UserContextValue {
  /** Current user profile or null if not authenticated */
  user: UserProfile | null;
  /** Quick access flag for admin role */
  isAdmin: boolean;
  /** Quick access flag for employer role */
  isEmployer: boolean;
  /** Quick access flag for student role */
  isStudent: boolean;
  /** Quick access flag for verified users */
  isVerified: boolean;
}

/**
 * Role hierarchy and permissions
 */
export const ROLE_HIERARCHY: Record<Role, number> = {
  guest: 0,
  student: 1,
  employer: 2,
  admin: 3,
} as const;

/**
 * Available permissions in the system
 */
export type Permission =
  | "view_public"
  | "apply_gigs"
  | "post_gigs"
  | "manage_gigs"
  | "manage_profile"
  | "hire_freelancers"
  | "view_admin_panel"
  | "manage_users"
  | "view_analytics"
  | "manage_system"
  | "*"; // Wildcard for admin

/**
 * Permission sets by role
 */
export const ROLE_PERMISSIONS = {
  guest: ["view_public"] as const,
  student: ["view_public", "apply_gigs", "manage_profile"] as const,
  employer: [
    "view_public",
    "post_gigs",
    "manage_gigs",
    "hire_freelancers",
    "manage_profile",
  ] as const,
  admin: ["*"] as const, // All permissions
} as const satisfies Record<Role, readonly Permission[]>;

/**
 * Type guard to check if a value is a valid Role
 */
export function isValidRole(value: unknown): value is Role {
  return (
    typeof value === "string" &&
    ["student", "employer", "admin", "guest"].includes(value)
  );
}

/**
 * Type guard to check if metadata has valid structure
 */
export function isValidUserMetadata(
  metadata: unknown,
): metadata is UserPublicMetadata {
  if (!metadata || typeof metadata !== "object") return false;

  const meta = metadata as Record<string, unknown>;

  // Role is optional but must be valid if present
  if (meta.role !== undefined && !isValidRole(meta.role)) return false;

  // Verified is optional but must be boolean if present
  if (meta.verified !== undefined && typeof meta.verified !== "boolean")
    return false;

  return true;
}
