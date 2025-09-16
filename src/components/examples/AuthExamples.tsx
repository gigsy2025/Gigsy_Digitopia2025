/**
 * USER AUTHENTICATION SYSTEM USAGE EXAMPLES
 *
 * This file demonstrates how to use the new Clerk-based authentication
 * and authorization system throughout the application.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-14
 */

"use client";

import React from "react";
import Image from "next/image";
import {
  useUser,
  usePermission,
  useMinimumRole,
  useBusinessPermissions,
  useUserDisplay,
  ConditionalRender,
  RoleGate,
  PermissionGate,
} from "@/providers/UserContext";
import type { Permission } from "@/types/auth";

/**
 * Example: Basic user information display
 */
export function UserProfileExample() {
  const { user, isAdmin, isEmployer, isStudent, isVerified } = useUser();
  const { displayName, email, avatar, initials } = useUserDisplay();

  return (
    <div className="space-y-4">
      <h2>User Profile</h2>

      {/* Basic user info */}
      <div>
        <p>Name: {displayName}</p>
        <p>Email: {email ?? "No email"}</p>
        <p>Role: {user?.role ?? "guest"}</p>
        <p>Verified: {isVerified ? "Yes" : "No"}</p>
      </div>

      {/* Role-based badges */}
      <div className="flex gap-2">
        {isAdmin && <span className="badge badge-red">Admin</span>}
        {isEmployer && <span className="badge badge-green">Employer</span>}
        {isStudent && <span className="badge badge-blue">Student</span>}
      </div>

      {/* Avatar display */}
      <div className="flex items-center gap-2">
        {avatar ? (
          <Image
            src={avatar}
            alt={displayName}
            width={32}
            height={32}
            className="h-8 w-8 rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-300">
            {initials}
          </div>
        )}
        <span>{displayName}</span>
      </div>
    </div>
  );
}

/**
 * Example: Permission-based UI rendering
 */
export function PermissionBasedUIExample() {
  const canPostGigs = usePermission("post_gigs");
  const canManageUsers = usePermission("manage_users");
  const canViewAnalytics = usePermission("view_analytics");

  return (
    <div className="space-y-4">
      <h2>Available Actions</h2>

      {/* Direct permission checks */}
      {canPostGigs && <button className="btn-primary">Post New Gig</button>}

      {canManageUsers && (
        <button className="btn-secondary">Manage Users</button>
      )}

      {canViewAnalytics && (
        <button className="btn-outline">View Analytics</button>
      )}

      {/* Using PermissionGate component */}
      <PermissionGate
        permission="manage_gigs"
        fallback={<p>You don&apos;t have permission to manage gigs.</p>}
      >
        <button className="btn-primary">Manage My Gigs</button>
      </PermissionGate>
    </div>
  );
}

/**
 * Example: Role-based access control
 */
export function RoleBasedAccessExample() {
  const hasEmployerAccess = useMinimumRole("employer");

  return (
    <div className="space-y-4">
      <h2>Role-Based Features</h2>

      {/* Direct role checks */}
      {hasEmployerAccess && (
        <div className="rounded border p-4">
          <h3>Employer Dashboard</h3>
          <p>Welcome to your employer dashboard!</p>
        </div>
      )}

      {/* Using RoleGate component */}
      <RoleGate role="admin" fallback={<p>Admin access required.</p>}>
        <div className="rounded border bg-red-50 p-4">
          <h3>Admin Panel</h3>
          <p>System administration tools</p>
        </div>
      </RoleGate>

      {/* Nested role checks */}
      <ConditionalRender
        authenticated={
          <div>
            <RoleGate role="student">
              <p>Student-specific content</p>
            </RoleGate>

            <RoleGate role="employer">
              <p>Employer-specific content</p>
            </RoleGate>
          </div>
        }
        unauthenticated={<p>Please sign in to access this content.</p>}
      />
    </div>
  );
}

/**
 * Example: Business-specific permission helpers
 */
export function BusinessPermissionsExample() {
  const {
    canManageGigs,
    canApplyToGigs,
    canHireFreelancers,
    canAccessAdmin,
    canViewAnalytics,
  } = useBusinessPermissions();

  return (
    <div className="space-y-4">
      <h2>Business Actions</h2>

      <div className="grid grid-cols-2 gap-4">
        {canApplyToGigs && (
          <div className="rounded border p-4">
            <h3>Apply to Gigs</h3>
            <p>Browse and apply to available gigs</p>
            <button className="btn-primary">Browse Gigs</button>
          </div>
        )}

        {canManageGigs && (
          <div className="rounded border p-4">
            <h3>Manage Gigs</h3>
            <p>Create and manage your gig postings</p>
            <button className="btn-primary">Manage Gigs</button>
          </div>
        )}

        {canHireFreelancers && (
          <div className="rounded border p-4">
            <h3>Hire Freelancers</h3>
            <p>Review applications and hire talent</p>
            <button className="btn-primary">Review Applications</button>
          </div>
        )}

        {canViewAnalytics && (
          <div className="rounded border p-4">
            <h3>Analytics</h3>
            <p>View performance metrics</p>
            <button className="btn-primary">View Analytics</button>
          </div>
        )}
      </div>

      {canAccessAdmin && (
        <div className="rounded border bg-gray-50 p-4">
          <h3>Admin Tools</h3>
          <p>System administration and user management</p>
          <div className="mt-2 flex gap-2">
            <button className="btn-secondary">User Management</button>
            <button className="btn-secondary">System Settings</button>
            <button className="btn-secondary">Reports</button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Example: Navigation menu with role-based items
 */
export function NavigationExample() {
  const menuItems: Array<{
    label: string;
    href: string;
    permission: Permission | null;
  }> = [
    { label: "Dashboard", href: "/app", permission: null },
    { label: "Browse Gigs", href: "/app/gigs", permission: "view_public" },
    {
      label: "My Applications",
      href: "/app/applications",
      permission: "apply_gigs",
    },
    { label: "My Gigs", href: "/app/my-gigs", permission: "manage_gigs" },
    { label: "Post Gig", href: "/app/post-gig", permission: "post_gigs" },
    {
      label: "Analytics",
      href: "/app/analytics",
      permission: "view_analytics",
    },
    { label: "Admin", href: "/app/admin", permission: "view_admin_panel" },
  ];

  return (
    <nav className="space-y-2">
      <h2>Navigation Menu</h2>

      {menuItems.map((item) => {
        if (!item.permission) {
          return (
            <a key={item.href} href={item.href} className="nav-link">
              {item.label}
            </a>
          );
        }

        return (
          <PermissionGate key={item.href} permission={item.permission}>
            <a href={item.href} className="nav-link">
              {item.label}
            </a>
          </PermissionGate>
        );
      })}
    </nav>
  );
}

/**
 * Complete dashboard component demonstrating all features
 */
export function AuthDashboardExample() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 p-6">
      <h1>Authentication System Demo</h1>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <UserProfileExample />
        <PermissionBasedUIExample />
        <RoleBasedAccessExample />
        <BusinessPermissionsExample />
      </div>

      <NavigationExample />
    </div>
  );
}
