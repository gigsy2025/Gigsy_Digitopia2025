/**
 * DYNAMIC ICON COMPONENT
 *
 * Performance-optimized icon loading system using Lucide React.
 * Implements lazy loading, error boundaries, and accessibility.
 *
 * PERFORMANCE: Tree-shaking friendly, dynamic imports, memoization.
 * ACCESSIBILITY: Proper ARIA attributes and screen reader support.
 * UX: Graceful fallbacks and loading states.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-14
 */

"use client";

import React, { Suspense, useMemo } from "react";
import dynamic from "next/dynamic";
import type { LucideProps } from "lucide-react";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Map of icon names to their dynamic imports
 * This enables tree-shaking and only bundles used icons
 */
const iconMap = {
  // Navigation Icons
  LayoutDashboard: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.LayoutDashboard })),
  ),
  Search: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.Search })),
  ),
  Bell: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.Bell })),
  ),
  Settings: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.Settings })),
  ),

  // Learning Icons
  BookOpen: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.BookOpen })),
  ),
  GraduationCap: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.GraduationCap })),
  ),
  Library: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.Library })),
  ),
  Award: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.Award })),
  ),
  TrendingUp: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.TrendingUp })),
  ),

  // Work Icons
  Briefcase: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.Briefcase })),
  ),
  MapPin: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.MapPin })),
  ),
  Plus: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.Plus })),
  ),
  FileText: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.FileText })),
  ),
  DollarSign: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.DollarSign })),
  ),

  Compass: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.Compass })),
  ),
  ClipboardList: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.ClipboardList })),
  ),
  Bookmark: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.Bookmark })),
  ),

  // Growth Icons
  User: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.User })),
  ),
  Folder: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.Folder })),
  ),
  Users: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.Users })),
  ),
  Target: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.Target })),
  ),

  // Community Icons
  MessageSquare: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.MessageSquare })),
  ),
  Users2: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.Users2 })),
  ),
  Calendar: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.Calendar })),
  ),

  // Gamification Icons
  Trophy: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.Trophy })),
  ),
  Crown: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.Crown })),
  ),
  Zap: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.Zap })),
  ),

  // Admin Icons
  Shield: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.Shield })),
  ),
  UserCog: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.UserCog })),
  ),
  Flag: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.Flag })),
  ),
  BarChart: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.BarChart })),
  ),

  // Account Icons
  CreditCard: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.CreditCard })),
  ),
  HelpCircle: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.HelpCircle })),
  ),
  ExternalLink: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.ExternalLink })),
  ),

  // UI Icons
  ChevronDown: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.ChevronDown })),
  ),
  ChevronRight: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.ChevronRight })),
  ),
  ChevronUp: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.ChevronUp })),
  ),
  Menu: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.Menu })),
  ),
  X: dynamic(() => import("lucide-react").then((mod) => ({ default: mod.X }))),

  // System Icons
  User2: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.User2 })),
  ),
  LogOut: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.LogOut })),
  ),

  // Error/Fallback Icons
  AlertCircle: dynamic(() =>
    import("lucide-react").then((mod) => ({ default: mod.AlertCircle })),
  ),
} as const;

/**
 * Type for available icon names
 */
export type IconName = keyof typeof iconMap;

/**
 * Props for the DynamicIcon component
 */
export interface DynamicIconProps extends Omit<LucideProps, "ref"> {
  /**
   * Name of the icon to render
   */
  name: IconName;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Size preset for common icon sizes
   */
  size?: "xs" | "sm" | "md" | "lg" | "xl";

  /**
   * Accessibility label for screen readers
   */
  "aria-label"?: string;

  /**
   * Whether the icon is decorative (hidden from screen readers)
   */
  "aria-hidden"?: boolean;

  /**
   * Fallback icon to show if the requested icon fails to load
   */
  fallback?: IconName;

  /**
   * Loading icon to show while the icon is being loaded
   */
  loading?: boolean;
}

/**
 * Size class mappings for icon presets
 */
const sizeClasses = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-8 w-8",
} as const;

/**
 * Loading placeholder component
 */
const IconLoader: React.FC<{ className?: string }> = ({ className }) => (
  <Loader2 className={cn("animate-spin", className)} aria-hidden="true" />
);

/**
 * Error fallback component
 */
const IconError: React.FC<{ className?: string }> = ({ className }) => (
  <AlertCircle
    className={cn("text-muted-foreground", className)}
    aria-hidden="true"
  />
);

/**
 * Error boundary for icon loading failures
 */
class IconErrorBoundary extends React.Component<
  {
    children: React.ReactNode;
    fallback: React.ComponentType<{ className?: string }>;
  },
  { hasError: boolean }
> {
  constructor(props: {
    children: React.ReactNode;
    fallback: React.ComponentType<{ className?: string }>;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Icon loading error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      return <FallbackComponent />;
    }

    return this.props.children;
  }
}

/**
 * Dynamic Icon Component
 *
 * Renders Lucide icons with dynamic loading, error handling, and accessibility.
 * Optimized for performance with tree-shaking and memoization.
 *
 * @example
 * ```tsx
 * <DynamicIcon name="BookOpen" size="md" aria-label="Learning courses" />
 * ```
 */
export const DynamicIcon: React.FC<DynamicIconProps> = React.memo(
  ({
    name,
    className,
    size = "md",
    fallback = "AlertCircle",
    loading = false,
    "aria-label": ariaLabel,
    "aria-hidden": ariaHidden = !ariaLabel,
    ...props
  }) => {
    // Resolve size classes
    const sizeClass = sizeClasses[size];
    const iconClassName = cn(sizeClass, className);

    // Get the dynamic icon component - moved before early returns to avoid conditional hook calls
    const IconComponent = useMemo(() => {
      const icon = iconMap[name];
      if (!icon) {
        console.warn(
          `Icon "${name}" not found in iconMap. Available icons:`,
          Object.keys(iconMap),
        );
        return iconMap[fallback] ?? iconMap.AlertCircle;
      }
      return icon;
    }, [name, fallback]);

    // Show loading state if requested
    if (loading) {
      return <IconLoader className={iconClassName} />;
    }

    return (
      <IconErrorBoundary
        fallback={(_props) => <IconError className={iconClassName} />}
      >
        <Suspense fallback={<IconLoader className={iconClassName} />}>
          <IconComponent
            className={iconClassName}
            aria-label={ariaLabel}
            aria-hidden={ariaHidden}
            {...props}
          />
        </Suspense>
      </IconErrorBoundary>
    );
  },
);

DynamicIcon.displayName = "DynamicIcon";

/**
 * Icon utilities for external use
 */
export const IconUtils = {
  /**
   * Get all available icon names
   */
  getAvailableIcons: (): IconName[] => {
    return Object.keys(iconMap) as IconName[];
  },

  /**
   * Check if an icon name is valid
   */
  isValidIcon: (name: string): name is IconName => {
    return name in iconMap;
  },

  /**
   * Get icon count for analytics
   */
  getIconCount: (): number => {
    return Object.keys(iconMap).length;
  },

  /**
   * Preload specific icons (useful for critical path optimization)
   */
  preloadIcons: async (names: IconName[]): Promise<void> => {
    try {
      await Promise.all(
        names.map((name) => {
          const IconComponent = iconMap[name];
          return IconComponent ? import("lucide-react") : Promise.resolve();
        }),
      );
    } catch (error) {
      console.error("Error preloading icons:", error);
    }
  },
};

/**
 * Hook for icon management
 */
export const useIconPreloader = () => {
  const preloadCriticalIcons = React.useCallback(async () => {
    // Preload icons that are likely to be needed immediately
    const criticalIcons: IconName[] = [
      "LayoutDashboard",
      "Search",
      "Bell",
      "Settings",
      "User",
      "Menu",
      "X",
    ];

    await IconUtils.preloadIcons(criticalIcons);
  }, []);

  React.useEffect(() => {
    // Preload critical icons on mount
    void preloadCriticalIcons();
  }, [preloadCriticalIcons]);

  return {
    preloadIcons: IconUtils.preloadIcons,
    preloadCriticalIcons,
  };
};
