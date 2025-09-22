/**
 * PROGRESS SYNC INDICATOR COMPONENT
 *
 * Professional progress sync indicator that displays the current state
 * of the debounced progress tracking system. Shows sync status, pending
 * updates, and retry information to users.
 *
 * FEATURES:
 * - Real-time sync status display
 * - Pending updates counter
 * - Retry status and error handling
 * - Professional animations and transitions
 * - Accessibility compliance
 * - Mobile-responsive design
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-14
 */

"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  Cloud,
  CloudOff,
  Wifi,
  WifiOff,
} from "lucide-react";

// =============================================================================
// TYPES AND INTERFACES
// =============================================================================

export interface ProgressSyncState {
  isPendingSync: boolean;
  lastSyncedAt: number;
  pendingUpdates: number;
  retryCount: number;
  error: string | null;
}

export interface ProgressSyncIndicatorProps {
  state: ProgressSyncState;
  onForceSync?: () => void;
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export function ProgressSyncIndicator({
  state,
  onForceSync,
  className,
  showDetails = true,
  compact = false,
}: ProgressSyncIndicatorProps) {
  const { isPendingSync, lastSyncedAt, pendingUpdates, retryCount, error } =
    state;

  // Calculate time since last sync
  const timeSinceLastSync = lastSyncedAt > 0 ? Date.now() - lastSyncedAt : 0;
  const minutesSinceSync = Math.floor(timeSinceLastSync / (1000 * 60));
  const hoursSinceSync = Math.floor(minutesSinceSync / 60);

  // Determine sync status
  const getSyncStatus = () => {
    if (error) return "error";
    if (isPendingSync) return "syncing";
    if (pendingUpdates > 0) return "pending";
    if (timeSinceLastSync < 300000) return "synced"; // Less than 5 minutes
    if (timeSinceLastSync < 1800000) return "recent"; // Less than 30 minutes
    return "stale";
  };

  const syncStatus = getSyncStatus();

  // Get status configuration
  const statusConfig = {
    synced: {
      icon: CheckCircle,
      label: "Synced",
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      description: "Progress saved",
    },
    syncing: {
      icon: RefreshCw,
      label: "Syncing",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Saving progress...",
    },
    pending: {
      icon: Clock,
      label: "Pending",
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-200",
      description: "Updates queued",
    },
    recent: {
      icon: Cloud,
      label: "Recent",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      description: "Recently synced",
    },
    stale: {
      icon: CloudOff,
      label: "Stale",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
      description: "Sync needed",
    },
    error: {
      icon: AlertCircle,
      label: "Error",
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      description: "Sync failed",
    },
  };

  const config = statusConfig[syncStatus];
  const Icon = config.icon;

  // Format time since last sync
  const formatTimeSinceSync = () => {
    if (lastSyncedAt === 0) return "Never";
    if (hoursSinceSync > 0) return `${hoursSinceSync}h ago`;
    if (minutesSinceSync > 0) return `${minutesSinceSync}m ago`;
    return "Just now";
  };

  // Compact version for minimal space
  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                "flex items-center gap-1 rounded-md px-2 py-1 text-xs",
                config.bgColor,
                config.borderColor,
                "border",
                className,
              )}
            >
              <Icon className={cn("h-3 w-3", config.color)} />
              {pendingUpdates > 0 && (
                <span className="text-xs font-medium">{pendingUpdates}</span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <div className="space-y-1">
              <div className="font-medium">{config.label}</div>
              <div className="text-muted-foreground text-sm">
                {config.description}
              </div>
              {lastSyncedAt > 0 && (
                <div className="text-muted-foreground text-xs">
                  Last sync: {formatTimeSinceSync()}
                </div>
              )}
              {pendingUpdates > 0 && (
                <div className="text-muted-foreground text-xs">
                  {pendingUpdates} updates pending
                </div>
              )}
              {retryCount > 0 && (
                <div className="text-muted-foreground text-xs">
                  Retries: {retryCount}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Full version with details
  return (
    <div
      className={cn(
        "space-y-2 rounded-lg border p-3",
        config.bgColor,
        config.borderColor,
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", config.color)} />
          <span className={cn("text-sm font-medium", config.color)}>
            {config.label}
          </span>
        </div>

        {onForceSync && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onForceSync}
            disabled={isPendingSync}
            className="h-6 px-2 text-xs"
          >
            <RefreshCw
              className={cn("h-3 w-3", isPendingSync && "animate-spin")}
            />
          </Button>
        )}
      </div>

      {/* Details */}
      {showDetails && (
        <div className="text-muted-foreground space-y-1 text-xs">
          <div>{config.description}</div>

          {lastSyncedAt > 0 && <div>Last sync: {formatTimeSinceSync()}</div>}

          {pendingUpdates > 0 && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {pendingUpdates} updates pending
            </div>
          )}

          {retryCount > 0 && (
            <div className="flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {retryCount} retries
            </div>
          )}

          {error && (
            <div className="flex items-center gap-1 text-red-600">
              <AlertCircle className="h-3 w-3" />
              {error}
            </div>
          )}
        </div>
      )}

      {/* Progress bar for pending updates */}
      {pendingUpdates > 0 && (
        <div className="h-1 w-full rounded-full bg-gray-200">
          <div
            className="h-1 rounded-full bg-blue-600 transition-all duration-300"
            style={{ width: `${Math.min((pendingUpdates / 10) * 100, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// STATUS BADGE COMPONENT
// =============================================================================

export function ProgressSyncBadge({
  state,
  className,
}: {
  state: ProgressSyncState;
  className?: string;
}) {
  const { isPendingSync, pendingUpdates, error } = state;

  const getBadgeVariant = () => {
    if (error) return "destructive";
    if (isPendingSync) return "secondary";
    if (pendingUpdates > 0) return "outline";
    return "default";
  };

  const getBadgeText = () => {
    if (error) return "Sync Error";
    if (isPendingSync) return "Syncing...";
    if (pendingUpdates > 0) return `${pendingUpdates} Pending`;
    return "Synced";
  };

  return (
    <Badge variant={getBadgeVariant()} className={className}>
      {getBadgeText()}
    </Badge>
  );
}

// =============================================================================
// NETWORK STATUS INDICATOR
// =============================================================================

export function NetworkStatusIndicator({
  isOnline,
  className,
}: {
  isOnline: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {isOnline ? (
        <>
          <Wifi className="h-3 w-3 text-green-600" />
          <span className="text-xs text-green-600">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3 w-3 text-red-600" />
          <span className="text-xs text-red-600">Offline</span>
        </>
      )}
    </div>
  );
}

// =============================================================================
// PROGRESS SYNC SUMMARY
// =============================================================================

export function ProgressSyncSummary({
  state,
  onForceSync,
  className,
}: {
  state: ProgressSyncState;
  onForceSync?: () => void;
  className?: string;
}) {
  const { lastSyncedAt, pendingUpdates, retryCount, error } = state;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Progress Sync</h4>
        {onForceSync && (
          <Button
            variant="outline"
            size="sm"
            onClick={onForceSync}
            className="h-7 px-2 text-xs"
          >
            Force Sync
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-muted-foreground">Last Sync:</span>
          <div className="font-medium">
            {lastSyncedAt > 0
              ? new Date(lastSyncedAt).toLocaleTimeString()
              : "Never"}
          </div>
        </div>

        <div>
          <span className="text-muted-foreground">Pending:</span>
          <div className="font-medium">{pendingUpdates}</div>
        </div>

        {retryCount > 0 && (
          <div>
            <span className="text-muted-foreground">Retries:</span>
            <div className="font-medium text-orange-600">{retryCount}</div>
          </div>
        )}

        {error && (
          <div className="col-span-2">
            <span className="text-muted-foreground">Error:</span>
            <div className="truncate font-medium text-red-600">{error}</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProgressSyncIndicator;
