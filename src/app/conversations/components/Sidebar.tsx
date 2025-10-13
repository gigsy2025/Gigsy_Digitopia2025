"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, MessageCircle } from "lucide-react";
import { useSelectedLayoutSegments } from "next/navigation";
import SidebarItem from "./SidebarItem";
import { chatConversations } from "@/lib/convex/client";
import {
  useConvexClient,
  useConvexSubscription,
} from "@/lib/convex/client-react";
import { mapConversationDocs } from "@/lib/convex/transformers";
import type { ConversationMeta } from "@/lib/convex/types/convo";
import { Button } from "@/components/ui/button";

interface SidebarProps {
  readonly initialConversations: ReadonlyArray<ConversationMeta>;
  readonly initialCursor: string | null;
  readonly initialIsDone: boolean;
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
}: SidebarProps) {
  const [conversations, setConversations] = useState<ConversationMeta[]>(() => [
    ...initialConversations,
  ]);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [isDone, setIsDone] = useState<boolean>(initialIsDone);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const convex = useConvexClient();
  const subscription = useConvexSubscription(chatConversations.getByGig, {
    limit: 25,
  });

  useEffect(() => {
    if (!subscription) {
      return;
    }

    const mapped = mapConversationDocs(subscription.page);
    setConversations((prev) => mergeConversations(prev, mapped));
    setCursor(subscription.continueCursor);
    setIsDone(subscription.isDone);
  }, [subscription]);

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
    } finally {
      setIsLoadingMore(false);
    }
  }, [convex, cursor, isDone, isLoadingMore]);

  const segments = useSelectedLayoutSegments();
  const activeConversationId = segments[segments.length - 1];

  const listContent = useMemo(() => {
    if (conversations.length === 0) {
      return (
        <div className="text-muted-foreground flex h-full flex-1 flex-col items-center justify-center px-6 text-center text-sm">
          <MessageCircle className="mb-3 h-8 w-8" aria-hidden />
          <p>
            No conversations yet. Start a discussion from a gig or candidate
            profile.
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {conversations.map((conversation) => (
          <SidebarItem
            key={conversation.id}
            conversation={conversation}
            href={`/conversations/${conversation.id}`}
            isActive={conversation.id === activeConversationId}
          />
        ))}
        {!isDone ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-2"
            disabled={isLoadingMore}
            onClick={() => void loadMore()}
          >
            {isLoadingMore ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading
              </span>
            ) : (
              "Load older conversations"
            )}
          </Button>
        ) : null}
      </div>
    );
  }, [activeConversationId, conversations, isDone, isLoadingMore, loadMore]);

  return (
    <aside className="border-border bg-card flex h-full w-80 min-w-[18rem] flex-col gap-4 border-r p-4">
      <div>
        <h1 className="text-foreground text-lg font-semibold">Messages</h1>
        <p className="text-muted-foreground text-xs">
          Conversations are sorted by the latest activity.
        </p>
      </div>
      {listContent}
    </aside>
  );
}
