"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Loader2,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useSelectedLayoutSegments } from "next/navigation";
import SidebarItem from "./SidebarItem";
import { chatConversations, users } from "@/lib/convex/client";
import {
  useConvexClient,
  useConvexSubscription,
} from "@/lib/convex/client-react";
import { mapConversationDocs } from "@/lib/convex/transformers";
import type {
  ConversationId,
  ConversationMeta,
  ConversationParticipantProfile,
} from "@/lib/convex/types/convo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deriveConversationDisplayProfile } from "../utils/display";
import type {
  ConversationDisplayProfile,
  ParticipantProfileLookup,
} from "../types";

interface SidebarProps {
  readonly initialConversations: ReadonlyArray<ConversationMeta>;
  readonly initialCursor: string | null;
  readonly initialIsDone: boolean;
  readonly viewerId: ConversationParticipantProfile["id"];
  readonly viewerProfile: ConversationParticipantProfile;
  readonly initialProfiles: ParticipantProfileLookup;
}

function mergeConversations(
  current: ReadonlyArray<ConversationMeta>,
  incoming: ReadonlyArray<ConversationMeta>,
): ConversationMeta[] {
  const next = new Map<string, ConversationMeta>();

  current.forEach((item) => {
    next.set(item.id, item);
  });

  incoming.forEach((item) => {
    const existing = next.get(item.id);
    next.set(item.id, existing ? { ...existing, ...item } : item);
  });

  return Array.from(next.values()).sort(
    (left, right) => (right.lastMessageAt ?? 0) - (left.lastMessageAt ?? 0),
  );
}

export default function Sidebar({
  initialConversations,
  initialCursor,
  initialIsDone,
  viewerId,
  viewerProfile,
  initialProfiles,
}: SidebarProps) {
  const [conversations, setConversations] = useState<ConversationMeta[]>(() => [
    ...initialConversations,
  ]);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [isDone, setIsDone] = useState<boolean>(initialIsDone);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [profiles, setProfiles] = useState<ParticipantProfileLookup>(() => ({
    ...initialProfiles,
  }));
  const profilesRef = useRef<ParticipantProfileLookup>({ ...initialProfiles });
  const convex = useConvexClient();
  const subscription = useConvexSubscription(chatConversations.getByGig, {
    limit: 25,
  });

  useEffect(() => {
    profilesRef.current = profiles;
  }, [profiles]);

  const ensureProfiles = useCallback(
    async (source: ReadonlyArray<ConversationMeta>) => {
      const missingIds = new Set<ConversationParticipantProfile["id"]>();

      for (const conversation of source) {
        for (const participantId of conversation.participants) {
          if (participantId === viewerId) {
            continue;
          }

          if (!profilesRef.current[participantId]) {
            missingIds.add(participantId);
          }
        }
      }

      if (missingIds.size === 0) {
        return;
      }

      const fetched = await convex.query(users.getPublicProfiles, {
        userIds: Array.from(missingIds),
      });

      setProfiles((previous) => {
        const next: ParticipantProfileLookup = { ...previous };
        for (const profile of fetched) {
          next[profile._id] = {
            id: profile._id,
            name: profile.name,
            avatarUrl: profile.avatarUrl ?? null,
          };
        }
        profilesRef.current = next;
        return next;
      });
    },
    [convex, viewerId],
  );

  useEffect(() => {
    if (!subscription) {
      return;
    }

    const mapped = mapConversationDocs(subscription.page);
    setConversations((prev) => mergeConversations(prev, mapped));
    setCursor(subscription.continueCursor);
    setIsDone(subscription.isDone);
    void ensureProfiles(mapped);
  }, [ensureProfiles, subscription]);

  const loadMore = useCallback(async () => {
    if (!cursor || isDone || isLoadingMore) {
      return;
    }

    setIsLoadingMore(true);
    try {
      const result = await convex.query(chatConversations.getByGig, {
        cursor,
        limit: 25,
      });
      const mapped = mapConversationDocs(result.page);
      setConversations((prev) => mergeConversations(prev, mapped));
      setCursor(result.continueCursor);
      setIsDone(result.isDone);
      await ensureProfiles(mapped);
    } finally {
      setIsLoadingMore(false);
    }
  }, [convex, cursor, ensureProfiles, isDone, isLoadingMore]);

  const segments = useSelectedLayoutSegments();
  const activeConversationId = segments[segments.length - 1];

  const displayProfiles = useMemo(() => {
    return conversations.reduce<
      Record<ConversationId, ConversationDisplayProfile>
    >(
      (accumulator, conversation) => {
        accumulator[conversation.id] = deriveConversationDisplayProfile({
          conversation,
          viewerId,
          profiles,
          viewerFallback: viewerProfile,
        });
        return accumulator;
      },
      {} as Record<ConversationId, ConversationDisplayProfile>,
    );
  }, [conversations, profiles, viewerId, viewerProfile]);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((previous) => !previous);
  }, []);

  const listContent = useMemo(() => {
    if (conversations.length === 0) {
      return (
        <div
          className={cn(
            "text-muted-foreground flex h-full flex-1 flex-col items-center justify-center",
            isCollapsed ? "px-2" : "px-6 text-center text-sm",
          )}
        >
          <MessageCircle className="mb-3 h-8 w-8" aria-hidden />
          {!isCollapsed ? (
            <p>
              No conversations yet. Start a discussion from a gig or candidate
              profile.
            </p>
          ) : null}
        </div>
      );
    }

    return (
      <div
        className={cn(
          "flex flex-1 overflow-y-auto",
          isCollapsed ? "flex-col items-center gap-3 py-2" : "flex-col gap-1",
        )}
      >
        {conversations.map((conversation) => (
          <SidebarItem
            key={conversation.id}
            conversation={conversation}
            href={`/app/conversations/${conversation.id}`}
            isActive={conversation.id === activeConversationId}
            profile={
              displayProfiles[conversation.id] ??
              deriveConversationDisplayProfile({
                conversation,
                viewerId,
                profiles,
                viewerFallback: viewerProfile,
              })
            }
            isCollapsed={isCollapsed}
          />
        ))}
        {!isDone ? (
          <Button
            type="button"
            variant="ghost"
            size={isCollapsed ? "icon" : "sm"}
            className={cn("mt-2", isCollapsed ? "rounded-full" : undefined)}
            disabled={isLoadingMore}
            onClick={() => void loadMore()}
            aria-label="Load more conversations"
          >
            {isLoadingMore ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : isCollapsed ? (
              <MessageCircle className="h-4 w-4" aria-hidden />
            ) : (
              "Load older conversations"
            )}
          </Button>
        ) : null}
      </div>
    );
  }, [
    activeConversationId,
    conversations,
    displayProfiles,
    isCollapsed,
    isDone,
    isLoadingMore,
    loadMore,
    profiles,
    viewerId,
    viewerProfile,
  ]);

  return (
    <aside
      className={cn(
        "border-border bg-card flex h-full flex-col gap-4 border-r transition-all duration-200",
        isCollapsed ? "w-20 min-w-[5rem] px-2 py-4" : "w-80 min-w-[18rem] p-4",
      )}
    >
      <div
        className={cn(
          "flex items-center",
          isCollapsed ? "justify-center" : "justify-between",
        )}
      >
        {!isCollapsed ? (
          <div>
            <h1 className="text-foreground text-lg font-semibold">Messages</h1>
            <p className="text-muted-foreground text-xs">
              Conversations are sorted by the latest activity.
            </p>
          </div>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleCollapsed}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="h-4 w-4" aria-hidden />
          ) : (
            <PanelLeftClose className="h-4 w-4" aria-hidden />
          )}
          <span className="sr-only">
            {isCollapsed
              ? "Expand conversations sidebar"
              : "Collapse conversations sidebar"}
          </span>
        </Button>
      </div>
      {listContent}
    </aside>
  );
}
