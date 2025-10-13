/**
 * SIDEBAR NAVIGATION DATA HOOK
 *
 * Central hub for generating dynamic navigation based on user permissions,
 * feature flags, and business logic. Supports real-time updates and caching.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-14
 */

import { useMemo } from "react";
import { usePathname } from "next/navigation";
import {
  useUserPermissions,
  PermissionUtils,
} from "@/hooks/useUserPermissions";
import type {
  NavigationGroup,
  NavigationItem,
  UserRole,
  FeatureFlag,
  UseSidebarData,
} from "@/types/sidebar";
import { useUser } from "@/providers/UserContext";

/**
 * Core navigation configuration for Gigsy platform
 * Organized by business domains for maintainability
 */
function createGigMarketplaceItems(): NavigationItem[] {
  return [
    {
      id: "gig-browse",
      title: "Browse Gigs",
      subtitle: "Curated opportunities",
      href: "/app/gigs",
      icon: "Compass",
      type: "route",
      priority: 1,
      analyticsCategory: "gigs",
    },
    {
      id: "gig-saved",
      title: "Saved Gigs",
      href: "/profile/saved",
      icon: "Bookmark",
      type: "route",
      priority: 2,
      analyticsCategory: "gigs",
    },
    {
      id: "gig-applications",
      title: "Applications",
      subtitle: "Track submissions",
      href: "/app/profile/applications",
      icon: "ClipboardList",
      type: "route",
      priority: 3,
      requiredRoles: ["freelancer"],
      analyticsCategory: "gigs",
    },
  ];
}

function createGigMarketplaceGroup(): NavigationGroup {
  return {
    id: "gig-marketplace",
    label: "Gigs",
    priority: 3,
    items: createGigMarketplaceItems(),
  };
}

function createGigsyNavigation(): NavigationGroup[] {
  return [
    // MAIN NAVIGATION - Core platform features
    {
      id: "main",
      label: "Main",
      priority: 1,
      items: [
        {
          id: "dashboard",
          title: "Dashboard",
          subtitle: "Overview & quick actions",
          href: "/app",
          icon: "LayoutDashboard",
          type: "route",
          priority: 1,
          analyticsCategory: "navigation",
          shortcut: "⌘D",
        },
        {
          id: "search",
          title: "Search",
          subtitle: "Find gigs, courses, mentors",
          href: "/app/search",
          icon: "Search",
          type: "route",
          priority: 2,
          analyticsCategory: "navigation",
          shortcut: "⌘K",
        },
        {
          id: "notifications",
          title: "Notifications",
          href: "/app/notifications",
          icon: "Bell",
          type: "route",
          priority: 3,
          badge: "2", // Dynamic from API
          analyticsCategory: "navigation",
        },
      ],
    },

    // LEARNING DOMAIN - Educational content and progress
    {
      id: "learning",
      label: "Learn",
      priority: 2,
      items: [
        {
          id: "courses",
          title: "Course Catalog",
          subtitle: "Discover and learn",
          href: "/app/courses",
          icon: "BookOpen",
          type: "route",
          priority: 1,
          analyticsCategory: "learning",
        },
        {
          id: "my-courses",
          title: "My Courses",
          subtitle: "Continue learning",
          href: "/app/learn/courses",
          icon: "GraduationCap",
          type: "route",
          priority: 2,
          analyticsCategory: "learning",
        },
        {
          id: "certifications",
          title: "Certifications",
          subtitle: "Your achievements",
          href: "/app/learn/certifications",
          icon: "Award",
          type: "route",
          priority: 3,
          analyticsCategory: "learning",
        },
        {
          id: "progress",
          title: "Learning Progress",
          href: "/app/learn/progress",
          icon: "TrendingUp",
          type: "route",
          priority: 4,
          analyticsCategory: "learning",
        },
      ],
    },

    // WORK DOMAIN - Gig economy and project management
    {
      id: "work",
      label: "Work",
      priority: 4,
      items: [
        {
          id: "my-gigs",
          title: "My Gigs",
          subtitle: "Active projects",
          href: "/app/work/gigs",
          icon: "Briefcase",
          type: "route",
          priority: 1,
          requiredRoles: ["freelancer", "client"],
          analyticsCategory: "work",
        },
        {
          id: "find-work",
          title: "Find Work",
          subtitle: "Browse opportunities",
          href: "/app/work/marketplace",
          icon: "MapPin",
          type: "route",
          priority: 2,
          requiredRoles: ["freelancer"],
          analyticsCategory: "work",
        },
        {
          id: "post-gig",
          title: "Post a Gig",
          subtitle: "Hire talented freelancers",
          href: "/app/work/post",
          icon: "Plus",
          type: "route",
          priority: 3,
          requiredRoles: ["client"],
          analyticsCategory: "work",
        },
        {
          id: "contracts",
          title: "Contracts",
          href: "/app/work/contracts",
          icon: "FileText",
          type: "route",
          priority: 4,
          requiredRoles: ["freelancer", "client"],
          analyticsCategory: "work",
        },
        {
          id: "earnings",
          title: "Earnings",
          href: "/app/work/earnings",
          icon: "DollarSign",
          type: "route",
          priority: 5,
          requiredRoles: ["freelancer"],
          analyticsCategory: "work",
        },
      ],
    },

    // GROWTH DOMAIN - Career development and mentorship
    createGigMarketplaceGroup(),

    {
      id: "growth",
      label: "Grow",
      priority: 5,
      items: [
        {
          id: "profile",
          title: "My Profile",
          subtitle: "Professional presence",
          href: "/app/profile",
          icon: "User",
          type: "route",
          priority: 1,
          analyticsCategory: "growth",
        },
        {
          id: "portfolio",
          title: "Portfolio",
          subtitle: "Showcase your work",
          href: "/app/profile/portfolio",
          icon: "Folder",
          type: "route",
          priority: 2,
          requiredRoles: ["freelancer", "mentor"],
          analyticsCategory: "growth",
        },
        {
          id: "mentorship",
          title: "Mentorship",
          subtitle: "Connect with experts",
          href: "/app/growth/mentorship",
          icon: "Users",
          type: "route",
          priority: 3,
          requiredFlags: ["mentor_marketplace"],
          analyticsCategory: "growth",
          isNew: true,
        },
        {
          id: "career-path",
          title: "Career Path",
          href: "/app/growth/career",
          icon: "Target",
          type: "route",
          priority: 4,
          analyticsCategory: "growth",
        },
      ],
    },

    // COMMUNITY DOMAIN - Social features and communication
    {
      id: "community",
      label: "Connect",
      priority: 6,
      items: [
        {
          id: "messages",
          title: "Messages",
          subtitle: "Chat with clients & mentors",
          href: "/app/conversations",
          icon: "MessageSquare",
          type: "route",
          priority: 1,
          badge: "3", // Dynamic from API
          analyticsCategory: "community",
        },
        {
          id: "forums",
          title: "Community Forums",
          subtitle: "Discuss and share",
          href: "/app/community/forums",
          icon: "Users2",
          type: "route",
          priority: 2,
          analyticsCategory: "community",
        },
        {
          id: "events",
          title: "Events",
          subtitle: "Workshops & networking",
          href: "/app/community/events",
          icon: "Calendar",
          type: "route",
          priority: 3,
          analyticsCategory: "community",
        },
      ],
    },

    // GAMIFICATION DOMAIN - Engagement and achievements
    {
      id: "gamification",
      label: "Play",
      priority: 7,
      requiredFlags: ["gamification_v2"],
      items: [
        {
          id: "achievements",
          title: "Achievements",
          subtitle: "Your accomplishments",
          href: "/app/achievements",
          icon: "Trophy",
          type: "route",
          priority: 1,
          analyticsCategory: "gamification",
        },
        {
          id: "leaderboard",
          title: "Leaderboards",
          subtitle: "See how you rank",
          href: "/app/leaderboard",
          icon: "Crown",
          type: "route",
          priority: 2,
          analyticsCategory: "gamification",
        },
        {
          id: "challenges",
          title: "Challenges",
          subtitle: "Weekly skill challenges",
          href: "/app/challenges",
          icon: "Zap",
          type: "route",
          priority: 3,
          analyticsCategory: "gamification",
          isBeta: true,
        },
      ],
    },

    // ADMIN DOMAIN - Platform administration
    {
      id: "admin",
      label: "Admin",
      priority: 8,
      requiredRoles: ["admin", "moderator"],
      items: [
        {
          id: "admin-dashboard",
          title: "Admin Dashboard",
          subtitle: "Platform overview",
          href: "/admin",
          icon: "Shield",
          type: "route",
          priority: 1,
          requiredRoles: ["admin"],
          analyticsCategory: "admin",
        },
        {
          id: "user-management",
          title: "User Management",
          href: "/admin/users",
          icon: "UserCog",
          type: "route",
          priority: 2,
          requiredRoles: ["admin", "moderator"],
          analyticsCategory: "admin",
        },
        {
          id: "content-moderation",
          title: "Content Moderation",
          href: "/admin/moderation",
          icon: "Flag",
          type: "route",
          priority: 3,
          requiredRoles: ["admin", "moderator"],
          analyticsCategory: "admin",
        },
        {
          id: "analytics",
          title: "Analytics",
          href: "/admin/analytics",
          icon: "BarChart",
          type: "route",
          priority: 4,
          requiredRoles: ["admin"],
          requiredFlags: ["advanced_analytics"],
          analyticsCategory: "admin",
        },
      ],
    },

    // ACCOUNT DOMAIN - User preferences and settings
    {
      id: "account",
      label: "Account",
      priority: 9,
      items: [
        {
          id: "settings",
          title: "Settings",
          subtitle: "Preferences & privacy",
          href: "/app/settings",
          icon: "Settings",
          type: "route",
          priority: 1,
          analyticsCategory: "account",
        },
        {
          id: "billing",
          title: "Billing",
          subtitle: "Subscription & payments",
          href: "/app/billing",
          icon: "CreditCard",
          type: "route",
          priority: 2,
          analyticsCategory: "account",
        },
        {
          id: "help",
          title: "Help & Support",
          href: "/app/support",
          icon: "HelpCircle",
          type: "route",
          priority: 3,
          analyticsCategory: "account",
        },
        {
          id: "divider",
          title: "",
          type: "divider",
          priority: 4,
        },
        {
          id: "documentation",
          title: "Documentation",
          href: "https://docs.gigsy.com",
          icon: "ExternalLink",
          type: "external",
          priority: 5,
          analyticsCategory: "external",
        },
      ],
    },
  ];
}

/**
 * Filter navigation items based on user permissions
 */
function filterNavigationByPermissions(
  groups: NavigationGroup[],
  permissions: { roles: UserRole[]; enabledFlags: FeatureFlag[] },
): NavigationGroup[] {
  return groups
    .filter((group) => {
      // Check group-level permissions
      if (
        group.requiredRoles &&
        !PermissionUtils.hasAnyRole(permissions.roles, group.requiredRoles)
      ) {
        return false;
      }
      if (
        group.requiredFlags &&
        !PermissionUtils.hasAllFlags(
          permissions.enabledFlags,
          group.requiredFlags,
        )
      ) {
        return false;
      }
      return true;
    })
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        // Check item-level permissions
        if (
          item.requiredRoles &&
          !PermissionUtils.hasAnyRole(permissions.roles, item.requiredRoles)
        ) {
          return false;
        }
        if (
          item.requiredFlags &&
          !PermissionUtils.hasAllFlags(
            permissions.enabledFlags,
            item.requiredFlags,
          )
        ) {
          return false;
        }
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0); // Remove empty groups
}

/**
 * Add dynamic data to navigation items (badges, recent items, etc.)
 */
function enrichNavigationWithDynamicData(
  groups: NavigationGroup[],
  pathname: string,
): NavigationGroup[] {
  // TODO: Integrate with real-time APIs for badges and notifications
  // For now, using mock data

  return groups.map((group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      // Mark currently active route
      isActive: pathname === item.href,
      // Add dynamic badges (would come from API calls)
      badge:
        item.id === "notifications"
          ? "2"
          : item.id === "messages"
            ? "3"
            : item.badge,
    })),
  }));
}

/**
 * Main hook for sidebar navigation data
 *
 * @returns Complete navigation structure with permissions applied
 */
export function useSidebarItems(): UseSidebarData {
  const pathname = usePathname();
  const permissions = useUserPermissions();
  const { user } = useUser();

  const navigationGroups = useMemo(() => {
    if (permissions.isLoading) {
      return []; // Return empty during loading
    }

    try {
      // Generate base navigation structure
      const baseNavigation = createGigsyNavigation();

      // Inject user-specific profile slug if available
      if (user) {
        const profileSlug = user.username ?? user.id;
        for (const group of baseNavigation) {
          for (const item of group.items) {
            if (item.id === "profile") {
              item.href = `/app/profile/${profileSlug}`;
            }
          }
        }
      }

      // Filter by user permissions
      const filteredNavigation = filterNavigationByPermissions(
        baseNavigation,
        permissions,
      );

      // Enrich with dynamic data
      const enrichedNavigation = enrichNavigationWithDynamicData(
        filteredNavigation,
        pathname,
      );

      // Sort by priority
      return enrichedNavigation
        .sort((a, b) => (a.priority ?? 99) - (b.priority ?? 99))
        .map((group) => ({
          ...group,
          items: group.items.sort(
            (a, b) => (a.priority ?? 99) - (b.priority ?? 99),
          ),
        }));
    } catch (error) {
      console.error("Error generating navigation:", error);
      return []; // Return empty on error
    }
  }, [permissions, pathname]);

  const refresh = async (): Promise<void> => {
    // Force re-render by updating pathname dependency
    // In a real app, this might invalidate cache keys or refetch data
    console.log("Refreshing sidebar navigation...");
  };

  return {
    navigationGroups,
    permissions,
    isLoading: permissions.isLoading,
    error: permissions.error,
    refresh,
  };
}

/**
 * Navigation utilities for external use
 */
export const NavigationUtils = {
  /**
   * Find navigation item by ID across all groups
   */
  findItemById: (
    groups: NavigationGroup[],
    id: string,
  ): NavigationItem | null => {
    for (const group of groups) {
      const item = group.items.find((item) => item.id === id);
      if (item) return item;

      // Search in nested children
      for (const item of group.items) {
        if (item.children) {
          const childItem = item.children.find((child) => child.id === id);
          if (childItem) return childItem;
        }
      }
    }
    return null;
  },

  /**
   * Get breadcrumb trail for current route
   */
  getBreadcrumbs: (
    groups: NavigationGroup[],
    pathname: string,
  ): NavigationItem[] => {
    // Simple implementation - in real app might parse route segments
    const item = NavigationUtils.findItemById(groups, pathname);
    return item ? [item] : [];
  },

  /**
   * Count total navigation items (for analytics)
   */
  getItemCount: (groups: NavigationGroup[]): number => {
    return groups.reduce(
      (total, group) =>
        total +
        group.items.length +
        group.items.reduce(
          (childTotal, item) => childTotal + (item.children?.length ?? 0),
          0,
        ),
      0,
    );
  },
};
