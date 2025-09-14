/**
 * ENTERPRISE SIDEBAR TYPE DEFINITIONS
 *
 * Type-safe navigation system for Gigsy platform with role-based access control,
 * feature flags, and dynamic menu tree generation.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-14
 */

import type { IconName } from "@/components/DynamicIcon";

/**
 * User roles that determine navigation access patterns
 */
export type UserRole =
  | "student" // Learning-focused users
  | "freelancer" // Gig workers and service providers
  | "client" // Project creators and gig requesters
  | "mentor" // Career guidance providers
  | "admin" // Platform administrators
  | "moderator"; // Content and community moderators

/**
 * Feature flags for progressive rollout and A/B testing
 */
export type FeatureFlag =
  | "advanced_analytics"
  | "beta_chat_features"
  | "gamification_v2"
  | "mentor_marketplace"
  | "enterprise_dashboard"
  | "mobile_notifications"
  | "ai_recommendations";

/**
 * Navigation item types for different interaction patterns
 */
export type NavigationItemType =
  | "route" // Internal Next.js routing
  | "external" // External URLs (open in new tab)
  | "action" // Trigger custom actions
  | "divider" // Visual separation
  | "group"; // Expandable section

/**
 * Core navigation item interface with comprehensive metadata
 */
export interface NavigationItem {
  /** Unique identifier for analytics and state management */
  id: string;

  /** Display title (supports i18n keys) */
  title: string;

  /** Optional subtitle for additional context */
  subtitle?: string;

  /** Navigation destination or action identifier */
  href?: string;

  /** Lucide icon component name for dynamic loading */
  icon?: IconName;

  /** Navigation item behavior type */
  type: NavigationItemType;

  /** Required user roles (empty array = accessible to all) */
  requiredRoles?: UserRole[];

  /** Required feature flags (all must be enabled) */
  requiredFlags?: FeatureFlag[];

  /** Nested navigation items for hierarchical menus */
  children?: NavigationItem[];

  /** Badge content (notifications, counters) */
  badge?: string | number;

  /** Whether this item is currently active/selected */
  isActive?: boolean;

  /** Priority for sorting (lower = higher priority) */
  priority?: number;

  /** Whether item should be highlighted */
  isNew?: boolean;

  /** Analytics tracking category */
  analyticsCategory?: string;

  /** Keyboard shortcut (displayed in tooltip) */
  shortcut?: string;

  /** Custom CSS classes for styling overrides */
  className?: string;

  /** Whether item is currently in beta/experimental state */
  isBeta?: boolean;
}

/**
 * Navigation group for organizing related menu items
 */
export interface NavigationGroup {
  /** Unique group identifier */
  id: string;

  /** Group display label */
  label: string;

  /** Array of navigation items in this group */
  items: NavigationItem[];

  /** Required roles to view entire group */
  requiredRoles?: UserRole[];

  /** Required feature flags to view entire group */
  requiredFlags?: FeatureFlag[];

  /** Whether group should be collapsible */
  collapsible?: boolean;

  /** Default collapsed state */
  defaultCollapsed?: boolean;

  /** Group priority for ordering */
  priority?: number;
}

/**
 * User permission context for menu generation
 */
export interface UserPermissions {
  /** User's assigned roles */
  roles: UserRole[];

  /** Enabled feature flags for user */
  enabledFlags: FeatureFlag[];

  /** User's subscription tier */
  subscriptionTier?: "free" | "pro" | "enterprise";

  /** Custom permissions for granular access control */
  customPermissions?: string[];
}

/**
 * Sidebar state management interface
 */
export interface SidebarState {
  /** Whether sidebar is expanded */
  isExpanded: boolean;

  /** Currently active route */
  activeRoute: string;

  /** Expanded group IDs */
  expandedGroups: string[];

  /** Pinned navigation items */
  pinnedItems: string[];

  /** Recently accessed items */
  recentItems: string[];
}

/**
 * Analytics event for navigation tracking
 */
export interface SidebarAnalyticsEvent {
  /** Event type */
  action: "click" | "expand" | "collapse" | "pin" | "unpin";

  /** Target item ID */
  itemId: string;

  /** User context */
  userRole: UserRole;

  /** Timestamp */
  timestamp: Date;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Configuration for sidebar component behavior
 */
export interface SidebarConfig {
  /** Default collapsed state on mobile */
  defaultMobileCollapsed?: boolean;

  /** Enable keyboard navigation */
  enableKeyboardShortcuts?: boolean;

  /** Enable analytics tracking */
  enableAnalytics?: boolean;

  /** Maximum recent items to track */
  maxRecentItems?: number;

  /** Theme variant */
  variant?: "default" | "compact" | "enterprise";

  /** Performance optimization settings */
  performance?: {
    /** Enable virtualization for large lists */
    enableVirtualization?: boolean;

    /** Lazy load icons */
    lazyLoadIcons?: boolean;

    /** Debounce search (ms) */
    searchDebounce?: number;
  };
}

/**
 * Hook return type for sidebar data management
 */
export interface UseSidebarData {
  /** Generated navigation groups */
  navigationGroups: NavigationGroup[];

  /** Current user permissions */
  permissions: UserPermissions;

  /** Loading state */
  isLoading: boolean;

  /** Error state */
  error: Error | null;

  /** Refresh navigation data */
  refresh: () => Promise<void>;
}

/**
 * Props for the main AppSidebar component
 */
export interface AppSidebarProps {
  /** Custom configuration */
  config?: Partial<SidebarConfig>;

  /** Custom navigation items (overrides default) */
  customItems?: NavigationGroup[];

  /** Additional CSS classes */
  className?: string;

  /** Event handlers */
  onNavigate?: (item: NavigationItem) => void;
  onAnalytics?: (event: SidebarAnalyticsEvent) => void;
}
