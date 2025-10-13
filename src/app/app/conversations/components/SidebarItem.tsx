"use client";

import Link from "next/link";
import { useMemo } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import type { ConversationMeta } from "@/lib/convex/types/convo";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ConversationDisplayProfile } from "../types";

interface SidebarItemProps {
  readonly conversation: ConversationMeta;
  readonly href: string;
  readonly isActive: boolean;
  readonly profile: ConversationDisplayProfile;
  readonly isCollapsed: boolean;
}

function resolveTimestampLabel(timestamp: number | undefined): string {
  if (!timestamp) {
    return "";
  }

  try {
    return formatDistanceToNowStrict(timestamp, { addSuffix: true });
  } catch (error) {
    console.warn("Failed to format timestamp", error);
    return "";
  }
}

export default function SidebarItem({
  conversation,
  href,
  isActive,
  profile,
  isCollapsed,
}: SidebarItemProps) {
  const lastActivity = useMemo(
    () =>
      resolveTimestampLabel(
        conversation.lastMessageAt ?? conversation.createdAt,
      ),
    [conversation.createdAt, conversation.lastMessageAt],
  );

  if (isCollapsed) {
    return (
      <Link
        href={href}
        className={cn(
          "group flex flex-col items-center gap-1 rounded-lg border border-transparent p-2 transition-colors",
          isActive
            ? "border-primary/60 bg-primary/10 text-primary"
            : "hover:border-border hover:bg-muted/60",
        )}
        aria-label={`Open conversation with ${profile.name}`}
      >
        <Avatar
          className={cn(
            "border-border size-10 border",
            isActive ? "ring-primary ring-2" : undefined,
          )}
        >
          <AvatarImage
            src={profile.avatarUrl ?? undefined}
            alt=""
            aria-hidden
          />
          <AvatarFallback>{profile.initials}</AvatarFallback>
        </Avatar>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "group flex w-full flex-col gap-2 rounded-lg border border-transparent px-3 py-2 transition-colors",
        isActive
          ? "border-primary/60 bg-primary/10 text-primary"
          : "hover:border-border hover:bg-muted/60",
      )}
    >
      <div className="flex items-center gap-3">
        <Avatar className="border-border size-9 border">
          <AvatarImage
            src={profile.avatarUrl ?? undefined}
            alt={`${profile.name}'s profile picture`}
          />
          <AvatarFallback>{profile.initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-sm font-medium">
            <span className="truncate">{conversation.title}</span>
            {lastActivity ? (
              <span className="text-muted-foreground ml-3 shrink-0 text-xs">
                {lastActivity}
              </span>
            ) : null}
          </div>
          <div className="text-muted-foreground mt-0.5 line-clamp-1 text-xs">
            {profile.name}
          </div>
        </div>
      </div>
      <div className="text-muted-foreground flex items-center gap-2 text-xs">
        <span className="bg-secondary rounded-full px-2 py-0.5 text-[10px] tracking-wide uppercase">
          {conversation.type}
        </span>
        <span>{conversation.participants.length} participants</span>
      </div>
    </Link>
  );
}
