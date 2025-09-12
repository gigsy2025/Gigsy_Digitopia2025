/**
 * User Creation Utilities
 * Helper functions for creating users with proper defaults
 */

import type { CreateUserWithBalanceData, UserRole } from "../../types/users";
import { CreateUserWithBalanceSchema } from "../validations/users";

/**
 * Default user role when none is specified
 */
export const DEFAULT_USER_ROLE: UserRole = "user";

/**
 * Default user roles array
 */
export const DEFAULT_USER_ROLES: UserRole[] = [DEFAULT_USER_ROLE];

/**
 * Create user data with proper defaults applied
 * @param userData - User creation data
 * @returns User data with defaults applied
 */
export const createUserWithDefaults = (
  userData: CreateUserWithBalanceData,
): Required<CreateUserWithBalanceData> => {
  return {
    ...userData,
    roles: userData.roles ?? DEFAULT_USER_ROLES,
    initialBalance: userData.initialBalance ?? 0,
  };
};

/**
 * Validate and create user data with defaults
 * @param userData - Raw user creation data
 * @returns Validated user data with defaults or validation errors
 */
export const validateAndCreateUser = (userData: unknown) => {
  // Apply defaults before validation
  const dataWithDefaults = {
    ...userData,
    roles: (userData as any)?.roles ?? DEFAULT_USER_ROLES,
  };

  return CreateUserWithBalanceSchema.safeParse(dataWithDefaults);
};

/**
 * Check if a user has a specific role
 * @param userRoles - Array of user roles
 * @param role - Role to check for
 * @returns True if user has the role
 */
export const hasRole = (userRoles: UserRole[], role: UserRole): boolean => {
  return userRoles.includes(role);
};

/**
 * Check if a user is an admin
 * @param userRoles - Array of user roles
 * @returns True if user is an admin
 */
export const isAdmin = (userRoles: UserRole[]): boolean => {
  return hasRole(userRoles, "admin");
};

/**
 * Check if a user is a moderator or admin
 * @param userRoles - Array of user roles
 * @returns True if user has moderation privileges
 */
export const canModerate = (userRoles: UserRole[]): boolean => {
  return hasRole(userRoles, "admin") || hasRole(userRoles, "moderator");
};

/**
 * Check if a user is a freelancer
 * @param userRoles - Array of user roles
 * @returns True if user is a freelancer
 */
export const isFreelancer = (userRoles: UserRole[]): boolean => {
  return hasRole(userRoles, "freelancer");
};

/**
 * Check if a user is a client
 * @param userRoles - Array of user roles
 * @returns True if user is a client
 */
export const isClient = (userRoles: UserRole[]): boolean => {
  return hasRole(userRoles, "client");
};

/**
 * Add a role to user if not already present
 * @param userRoles - Current user roles
 * @param role - Role to add
 * @returns Updated roles array
 */
export const addRole = (userRoles: UserRole[], role: UserRole): UserRole[] => {
  if (hasRole(userRoles, role)) {
    return userRoles;
  }
  return [...userRoles, role];
};

/**
 * Remove a role from user
 * @param userRoles - Current user roles
 * @param role - Role to remove
 * @returns Updated roles array
 */
export const removeRole = (
  userRoles: UserRole[],
  role: UserRole,
): UserRole[] => {
  return userRoles.filter((r) => r !== role);
};

/**
 * Ensure user has at least the default role
 * @param userRoles - Current user roles
 * @returns Roles array with at least default role
 */
export const ensureDefaultRole = (userRoles: UserRole[]): UserRole[] => {
  if (userRoles.length === 0) {
    return DEFAULT_USER_ROLES;
  }
  return userRoles;
};

// Export all utility functions as a cohesive object
export const UserRoleUtils = {
  DEFAULT_USER_ROLE,
  DEFAULT_USER_ROLES,
  createUserWithDefaults,
  validateAndCreateUser,
  hasRole,
  isAdmin,
  canModerate,
  isFreelancer,
  isClient,
  addRole,
  removeRole,
  ensureDefaultRole,
} as const;
