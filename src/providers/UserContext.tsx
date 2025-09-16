/**
 * USER CONTEXT PROVIDER
 *
 * Client-side React Context for user authentication and authorization state.
 * Provides typed, performant access to user data and permission checks.
 *
 * SECURITY PRINCIPLES:
 * - Client context is for UI convenience only
 * - Never rely on client state for authorization
 * - All sensitive operations must be server-validated
 * - Immutable user state to prevent client tampering
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-14
 */

"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import {
  type UserProfile,
  type UserContextValue,
  type Permission,
} from "@/types/auth";
import { AuthorizationPolicies } from "@/lib/auth/policies";

/**
 * User Context definition
 */
const UserContext = createContext<UserContextValue | undefined>(undefined);

/**
 * Props for UserProvider component
 */
interface UserProviderProps {
  /** Initial user data from server */
  initialUser: UserProfile | null;
  /** Child components */
  children: ReactNode;
}

/**
 * User Context Provider Component
 *
 * Provides user authentication state and permission helpers to child components.
 * Uses useMemo for performance optimization and prevents unnecessary re-renders.
 */
export function UserProvider({ initialUser, children }: UserProviderProps) {
  const contextValue = useMemo<UserContextValue>(() => {
    return {
      user: initialUser,
      isAdmin: initialUser?.role === "admin",
      isEmployer: initialUser?.role === "employer",
      isStudent: initialUser?.role === "student",
      isVerified: initialUser?.verified ?? false,
    };
  }, [initialUser]);

  return (
    <UserContext.Provider value={contextValue}>{children}</UserContext.Provider>
  );
}

/**
 * Hook to access user context
 *
 * @throws Error if used outside UserProvider
 * @returns UserContextValue - Current user state and permission flags
 */
export function useUser(): UserContextValue {
  const context = useContext(UserContext);

  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }

  return context;
}

/**
 * Hook for permission-based access control
 *
 * @param permission - Permission to check
 * @returns boolean - Whether user has the permission
 */
export function usePermission(permission: Permission): boolean {
  const { user } = useUser();

  return useMemo(() => {
    return AuthorizationPolicies.hasPermission(user, permission);
  }, [user, permission]);
}

/**
 * Hook for role-based access control
 *
 * @param requiredRole - Minimum required role
 * @returns boolean - Whether user has sufficient role level
 */
export function useMinimumRole(requiredRole: UserProfile["role"]): boolean {
  const { user } = useUser();

  return useMemo(() => {
    return AuthorizationPolicies.hasMinimumRole(user, requiredRole);
  }, [user, requiredRole]);
}

/**
 * Hook for specific business logic permissions
 */
export function useBusinessPermissions() {
  const { user } = useUser();

  return useMemo(() => {
    return {
      canManageGigs: AuthorizationPolicies.canManageGigs(user),
      canApplyToGigs: AuthorizationPolicies.canApplyToGigs(user),
      canHireFreelancers: AuthorizationPolicies.canHireFreelancers(user),
      canAccessAdmin: AuthorizationPolicies.canAccessAdmin(user),
      canViewAnalytics: AuthorizationPolicies.canViewAnalytics(user),
    };
  }, [user]);
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated(): boolean {
  const { user } = useUser();
  return user !== null;
}

/**
 * Hook to get user display information
 */
export function useUserDisplay() {
  const { user } = useUser();

  return useMemo(() => {
    if (!user) {
      return {
        displayName: "Guest User",
        email: null,
        avatar: null,
        initials: "GU",
      };
    }

    const displayName = user.name ?? user.email ?? "Unknown User";
    const initials = user.name
      ? user.name
          .split(" ")
          .map((name) => name.charAt(0))
          .join("")
          .toUpperCase()
          .slice(0, 2)
      : (user.email?.charAt(0).toUpperCase() ?? "U");

    return {
      displayName,
      email: user.email,
      avatar: user.avatar,
      initials,
    };
  }, [user]);
}

/**
 * Component for conditional rendering based on authentication
 */
interface ConditionalRenderProps {
  authenticated?: ReactNode;
  unauthenticated?: ReactNode;
  children?: ReactNode;
}

export function ConditionalRender({
  authenticated,
  unauthenticated,
  children,
}: ConditionalRenderProps) {
  const isAuth = useIsAuthenticated();

  if (isAuth) {
    return <>{authenticated ?? children}</>;
  }

  return <>{unauthenticated}</>;
}

/**
 * Component for role-based conditional rendering
 */
interface RoleGateProps {
  role: UserProfile["role"];
  fallback?: ReactNode;
  children: ReactNode;
}

export function RoleGate({ role, fallback, children }: RoleGateProps) {
  const hasRole = useMinimumRole(role);

  if (hasRole) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}

/**
 * Component for permission-based conditional rendering
 */
interface PermissionGateProps {
  permission: Permission;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGate({
  permission,
  fallback,
  children,
}: PermissionGateProps) {
  const hasPermission = usePermission(permission);

  if (hasPermission) {
    return <>{children}</>;
  }

  return <>{fallback}</>;
}
