/**
 * ROLE-BASED ACCESS CONTROL POLICIES
 *
 * Central authorization logic for role-based permissions.
 * Provides consistent permission checking across the application.
 *
 * SECURITY PRINCIPLES:
 * - Server-side enforcement is authoritative
 * - Client-side checks are for UI convenience only
 * - All permission checks are auditable
 * - Fail-safe defaults (deny by default)
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-14
 */

import {
  type Role,
  type UserProfile,
  ROLE_HIERARCHY,
  ROLE_PERMISSIONS,
  type Permission,
} from "@/types/auth";

/**
 * Permission checking policies
 */
export class AuthorizationPolicies {
  /**
   * Check if user has specific permission
   */
  static hasPermission(
    user: UserProfile | null,
    permission: Permission,
  ): boolean {
    if (!user) return permission === "view_public";

    const userRole = user.role;

    // Admin has all permissions
    if (userRole === "admin") return true;

    // Check specific permissions for the role
    const userPermissions = ROLE_PERMISSIONS[userRole];
    return userPermissions.some((p) => p === permission);
  }

  /**
   * Check if user has minimum role level
   */
  static hasMinimumRole(user: UserProfile | null, minRole: Role): boolean {
    if (!user) return minRole === "guest";

    return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minRole];
  }

  /**
   * Check if user can manage gigs
   */
  static canManageGigs(user: UserProfile | null): boolean {
    return (
      this.hasPermission(user, "manage_gigs") ||
      this.hasPermission(user, "post_gigs")
    );
  }

  /**
   * Check if user can apply to gigs
   */
  static canApplyToGigs(user: UserProfile | null): boolean {
    return this.hasPermission(user, "apply_gigs");
  }

  /**
   * Check if user can hire freelancers
   */
  static canHireFreelancers(user: UserProfile | null): boolean {
    return this.hasPermission(user, "hire_freelancers");
  }

  /**
   * Check if user can access admin features
   */
  static canAccessAdmin(user: UserProfile | null): boolean {
    return this.hasPermission(user, "view_admin_panel");
  }

  /**
   * Check if user can view analytics
   */
  static canViewAnalytics(user: UserProfile | null): boolean {
    return this.hasPermission(user, "view_analytics");
  }

  /**
   * Check if user is verified
   */
  static isVerified(user: UserProfile | null): boolean {
    return user?.verified ?? false;
  }

  /**
   * Check if user can perform action (with audit logging)
   */
  static canPerformAction(
    user: UserProfile | null,
    action: string,
    permission: Permission,
    context?: Record<string, unknown>,
  ): boolean {
    const hasPermission = this.hasPermission(user, permission);

    // Log access attempts for audit trail
    console.info("[Authorization] Permission check:", {
      userId: user?.id ?? "anonymous",
      userRole: user?.role ?? "guest",
      action,
      permission,
      allowed: hasPermission,
      context,
      timestamp: new Date().toISOString(),
    });

    return hasPermission;
  }

  /**
   * Get all permissions for a user role
   */
  static getPermissions(role: Role): readonly Permission[] {
    // Admin gets all permissions
    if (role === "admin") {
      return [
        "view_public",
        "apply_gigs",
        "post_gigs",
        "manage_gigs",
        "manage_profile",
        "hire_freelancers",
        "view_admin_panel",
        "manage_users",
        "view_analytics",
        "manage_system",
      ] as const;
    }

    return ROLE_PERMISSIONS[role] as readonly Permission[];
  }
}

/**
 * Role-based UI helpers
 */
export class RoleHelpers {
  /**
   * Get role display name
   */
  static getRoleDisplayName(role: Role): string {
    const displayNames: Record<Role, string> = {
      guest: "Guest",
      student: "Student",
      employer: "Employer",
      admin: "Administrator",
    };

    return displayNames[role];
  }

  /**
   * Get role color for UI
   */
  static getRoleColor(role: Role): string {
    const colors: Record<Role, string> = {
      guest: "gray",
      student: "blue",
      employer: "green",
      admin: "red",
    };

    return colors[role];
  }

  /**
   * Check if role upgrade is possible
   */
  static canUpgradeRole(currentRole: Role, targetRole: Role): boolean {
    // Only allow upgrades within the hierarchy
    return ROLE_HIERARCHY[targetRole] > ROLE_HIERARCHY[currentRole];
  }

  /**
   * Get next available role in hierarchy
   */
  static getNextRole(currentRole: Role): Role | null {
    const currentLevel = ROLE_HIERARCHY[currentRole];
    const roles = Object.entries(ROLE_HIERARCHY);

    const nextRole = roles.find(([_, level]) => level === currentLevel + 1);
    return nextRole ? (nextRole[0] as Role) : null;
  }
}

/**
 * Client-side permission hook helper types
 */
export interface PermissionHookResult {
  hasPermission: boolean;
  isLoading: boolean;
  error?: string;
}
