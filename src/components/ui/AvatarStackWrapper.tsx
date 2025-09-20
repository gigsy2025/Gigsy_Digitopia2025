/**
 * AVATAR STACK WRAPPER
 *
 * Wrapper component that tries to use Kibo AvatarStack if available,
 * with graceful fallback to shadcn Avatar components.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-20
 */

"use client";

import React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { getInitials } from "@/utils/format";
import type { Author } from "@/types/course";

interface AvatarStackWrapperProps {
  authors: Author[];
  maxVisible?: number;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showTooltip?: boolean;
}

// Size configurations
const sizeConfig = {
  sm: { avatarSize: "h-6 w-6", textSize: "text-xs", offset: "-ml-2" },
  md: { avatarSize: "h-8 w-8", textSize: "text-sm", offset: "-ml-3" },
  lg: { avatarSize: "h-10 w-10", textSize: "text-base", offset: "-ml-4" },
  xl: { avatarSize: "h-12 w-12", textSize: "text-lg", offset: "-ml-5" },
};

/**
 * Try to import Kibo AvatarStack, fall back to our implementation
 */
let KiboAvatarStack: React.ComponentType<{
  animate?: boolean;
  className?: string;
  children: React.ReactNode;
}> | null = null;

try {
  // Import Kibo AvatarStack component using dynamic import
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const kiboModule = require("@/components/ui/kibo-ui/avatar-stack") as {
    AvatarStack: React.ComponentType<{
      animate?: boolean;
      className?: string;
      children: React.ReactNode;
    }>;
  };
  KiboAvatarStack = kiboModule.AvatarStack;
} catch {
  // Kibo UI not available, use fallback
  KiboAvatarStack = null;
}

/**
 * Fallback Avatar Stack implementation using shadcn components
 */
const FallbackAvatarStack: React.FC<AvatarStackWrapperProps> = ({
  authors,
  maxVisible = 3,
  size = "md",
  className,
  showTooltip = true,
}) => {
  const config = sizeConfig[size];

  // Guard against undefined or null authors
  if (!authors || !Array.isArray(authors) || authors.length === 0) {
    return null;
  }

  const visibleAuthors = authors.slice(0, maxVisible);
  const remainingCount = Math.max(0, authors.length - maxVisible);

  return (
    <div className={cn("flex items-center", className)}>
      {visibleAuthors.map((author, index) => (
        <div
          key={author.id}
          className={cn(
            "relative",
            index > 0 && config.offset,
            "ring-background rounded-full ring-2",
          )}
          title={
            showTooltip
              ? `${author.name}${author.role ? ` - ${author.role}` : ""}`
              : undefined
          }
        >
          <Avatar className={config.avatarSize}>
            <AvatarImage
              src={author.avatarUrl}
              alt={author.name}
              className="object-cover"
            />
            <AvatarFallback className={cn(config.textSize, "font-medium")}>
              {getInitials(author.name)}
            </AvatarFallback>
          </Avatar>
        </div>
      ))}

      {remainingCount > 0 && (
        <div
          className={cn(
            "bg-muted text-muted-foreground ring-background relative flex items-center justify-center rounded-full ring-2",
            config.avatarSize,
            config.textSize,
            config.offset,
          )}
          title={
            showTooltip
              ? `+${remainingCount} more ${remainingCount === 1 ? "author" : "authors"}`
              : undefined
          }
        >
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

/**
 * Kibo AvatarStack wrapper (if available)
 */
const KiboAvatarStackWrapper: React.FC<AvatarStackWrapperProps> = ({
  authors,
  maxVisible = 3,
  className,
}) => {
  if (!KiboAvatarStack) {
    return (
      <FallbackAvatarStack
        authors={authors}
        maxVisible={maxVisible}
        className={className}
      />
    );
  }

  // Guard against undefined or null authors
  if (!authors || !Array.isArray(authors) || authors.length === 0) {
    return null;
  }

  const visibleAuthors = authors.slice(0, maxVisible);
  const remainingCount = Math.max(0, authors.length - maxVisible);

  return (
    <KiboAvatarStack animate className={className}>
      {visibleAuthors.map((author) => (
        <Avatar key={author.id}>
          <AvatarImage src={author.avatarUrl} alt={author.name} />
          <AvatarFallback>{getInitials(author.name)}</AvatarFallback>
        </Avatar>
      ))}
      {remainingCount > 0 && (
        <Avatar>
          <AvatarFallback>+{remainingCount}</AvatarFallback>
        </Avatar>
      )}
    </KiboAvatarStack>
  );
};

/**
 * Main AvatarStackWrapper component
 */
export const AvatarStackWrapper: React.FC<AvatarStackWrapperProps> = (
  props,
) => {
  // Always try Kibo first, fallback to our implementation
  if (KiboAvatarStack) {
    return <KiboAvatarStackWrapper {...props} />;
  }

  return <FallbackAvatarStack {...props} />;
};

/**
 * Single Author Avatar component for when only one author is displayed
 */
export const AuthorAvatar: React.FC<{
  author: Author;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showRole?: boolean;
}> = ({ author, size = "md", className, showRole = false }) => {
  const config = sizeConfig[size];

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <Avatar className={config.avatarSize}>
        <AvatarImage
          src={author.avatarUrl}
          alt={author.name}
          className="object-cover"
        />
        <AvatarFallback className={cn(config.textSize, "font-medium")}>
          {getInitials(author.name)}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <p
          className={cn(
            "text-foreground truncate font-medium",
            config.textSize,
          )}
        >
          {author.name}
        </p>
        {showRole && author.role && (
          <p
            className={cn(
              "text-muted-foreground truncate",
              size === "sm" ? "text-xs" : "text-sm",
            )}
          >
            {author.role}
          </p>
        )}
      </div>
    </div>
  );
};

export default AvatarStackWrapper;
