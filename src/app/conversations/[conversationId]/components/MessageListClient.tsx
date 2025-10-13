"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { VariableSizeList } from "react-window";
import { Loader2 } from "lucide-react";
import {
  useConvexClient,
  useConvexSubscription,
} from "@/lib/convex/client-react";
import { mapMessageDocs, type RawMessageList } from "@/lib/convex/transformers";
import type {
  ConversationId,
  Message,
  MessageUpdateEvent,
  UserId,
} from "@/lib/convex/types/convo";
import { mergeMessages } from "@/lib/convex/merges";
import { cn } from "@/lib/utils";
import { chatMessages } from "@/lib/convex/references";

interface MessageListClientProps {
  readonly viewerId: UserId;
  readonly conversationId: ConversationId;
  readonly initialMessages: ReadonlyArray<Message>;
  readonly initialCursor: string | null;
  readonly initialIsDone: boolean;
  readonly children?: ReactNode;
}

interface MessageListController {
  readonly appendOptimisticMessage: (input: {
    readonly clientTempId: string;
    readonly body: string;
    readonly type: Message["type"];
  }) => void;
  readonly resolveMessage: (
    event: MessageUpdateEvent & { kind: "ack" },
  ) => void;
  readonly markMessageFailed: (clientTempId: string, error?: string) => void;
  readonly viewerId: UserId;
}

const MessageListContext = createContext<MessageListController | null>(null);

export function useMessageListActions(): MessageListController {
  const context = useContext(MessageListContext);
  if (!context) {
    throw new Error(
      "useMessageListActions must be used within MessageListClient",
    );
  }
  return context;
}

type ListItemData = {
  readonly messages: Message[];
  readonly viewerId: UserId;
  readonly setSize: (id: string, size: number) => void;
};

type VariableListHandle = {
  readonly scrollToItem: (
    index: number,
    align?: "auto" | "smart" | "center" | "end" | "start",
  ) => void;
  readonly resetAfterIndex: (
    index: number,
    shouldForceUpdate?: boolean,
  ) => void;
};

interface MessageRowProps {
  readonly index: number;
  readonly style: React.CSSProperties;
  readonly data: ListItemData;
}

type GetMessagesArgs = {
  readonly conversationId: ConversationId;
  readonly cursor?: string | null;
  readonly limit?: number;
};

function MessageBubble({
  message,
  viewerId,
  registerSize,
}: {
  readonly message: Message;
  readonly viewerId: UserId;
  readonly registerSize: (height: number) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isMine = message.senderId === viewerId;

  useLayoutEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const node = containerRef.current;
    const measure = () => {
      registerSize(node.getBoundingClientRect().height + 16);
    };

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver((entries) => {
        const entry = entries[0];
        if (!entry) {
          return;
        }
        registerSize(entry.contentRect.height + 16);
      });
      observer.observe(node);

      measure();

      return () => observer.disconnect();
    }

    registerSize(node.getBoundingClientRect().height + 16);
    return undefined;
  }, [registerSize, message.id]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex w-full flex-col gap-1 px-4 py-2",
        isMine ? "items-end" : "items-start",
      )}
    >
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm",
          isMine ? "bg-primary text-primary-foreground" : "bg-muted",
        )}
      >
        {message.body ? (
          <p className="break-words whitespace-pre-wrap">{message.body}</p>
        ) : null}
        {message.status === "pending" ? (
          <span className="text-muted-foreground mt-1 flex items-center gap-1 text-xs">
            <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> Sending…
          </span>
        ) : null}
        {message.status === "failed" ? (
          <span className="mt-1 text-xs text-red-500">
            Failed to send. {message.error ?? "Try again."}
          </span>
        ) : null}
      </div>
      <span className="text-muted-foreground text-xs">
        {new Date(message.createdAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    </div>
  );
}

function MessageRow({ data, index, style }: MessageRowProps) {
  const message = data.messages[index];
  const registerSize = useCallback(
    (height: number) => {
      if (!message) {
        return;
      }
      data.setSize(message.id, height);
    },
    [data, message],
  );

  if (!message) {
    return null;
  }

  return (
    <div style={style} className="outline-none">
      <MessageBubble
        message={message}
        viewerId={data.viewerId}
        registerSize={registerSize}
      />
    </div>
  );
}

export default function MessageListClient({
  viewerId,
  conversationId,
  initialMessages,
  initialCursor,
  initialIsDone,
  children,
}: MessageListClientProps) {
  const [messages, setMessages] = useState<Message[]>(() => [
    ...initialMessages,
  ]);
  const [cursor, setCursor] = useState<string | null>(initialCursor);
  const [isDone, setIsDone] = useState<boolean>(initialIsDone);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [listHeight, setListHeight] = useState<number>(0);
  const convex = useConvexClient();
  const sizeMapRef = useRef<Map<string, number>>(new Map());
  const listRef = useRef<VariableListHandle | null>(null);
  const assignListRef = useCallback((instance: VariableListHandle | null) => {
    listRef.current = instance;
  }, []);
  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pendingScrollBottomRef = useRef<number | null>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const messagesRef = useRef<Message[]>(initialMessages.slice());
  const forceScrollRef = useRef(false);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const loadOlder = useCallback(async () => {
    if (!cursor || isDone || isLoadingOlder) {
      return;
    }

    setIsLoadingOlder(true);
    const outer = outerRef.current;
    const previousBottom = outer ? outer.scrollHeight - outer.scrollTop : null;

    try {
      const result = await convex.query(chatMessages.getMessages, {
        conversationId,
        cursor,
        limit: 40,
      });

      const mapped = mapMessageDocs(result.page);
      setMessages((prev) =>
        mapped.reduce<Message[]>(
          (acc, message) => mergeMessages(acc, message),
          prev,
        ),
      );
      setCursor(result.continueCursor ?? null);
      setIsDone(result.isDone ?? false);

      if (previousBottom !== null) {
        pendingScrollBottomRef.current = previousBottom;
      }
    } finally {
      setIsLoadingOlder(false);
    }
  }, [conversationId, convex, cursor, isDone, isLoadingOlder]);

  const subscription = useConvexSubscription<GetMessagesArgs, RawMessageList>(
    chatMessages.getMessages,
    {
      conversationId,
      limit: 40,
    },
  );

  useEffect(() => {
    if (!subscription) {
      return;
    }

    const mapped = mapMessageDocs(subscription.page);
    setMessages((prev) =>
      mapped.reduce<Message[]>(
        (acc, message) => mergeMessages(acc, message),
        prev,
      ),
    );
    setCursor(subscription.continueCursor ?? null);
    setIsDone(subscription.isDone ?? false);
  }, [subscription]);

  useLayoutEffect(() => {
    if (!containerRef.current) {
      return;
    }

    const node = containerRef.current;
    const measure = () => {
      setListHeight(node.getBoundingClientRect().height);
      listRef.current?.resetAfterIndex(0, false);
    };

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(measure);
      observer.observe(node);
      measure();
      return () => observer.disconnect();
    }

    measure();
    return undefined;
  }, []);

  useEffect(() => {
    if (!outerRef.current) {
      return;
    }

    const node = outerRef.current;
    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = node;
      if (!isLoadingOlder && !isDone && scrollTop <= 32) {
        void loadOlder();
      }
      const atBottom = scrollHeight - (scrollTop + clientHeight) < 80;
      setIsAtBottom(atBottom);
    };

    node.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => node.removeEventListener("scroll", handleScroll);
  }, [isDone, isLoadingOlder, loadOlder]);

  useEffect(() => {
    if (pendingScrollBottomRef.current === null) {
      return;
    }

    const outer = outerRef.current;
    if (!outer) {
      return;
    }

    const previousBottom = pendingScrollBottomRef.current;
    outer.scrollTop = outer.scrollHeight - previousBottom;
    pendingScrollBottomRef.current = null;
  }, [messages]);

  const scrollToBottom = useCallback(() => {
    const list = listRef.current;
    const currentMessages = messagesRef.current;
    if (!list || currentMessages.length === 0) {
      return;
    }

    list.scrollToItem(currentMessages.length - 1, "end");
  }, []);

  useEffect(() => {
    if (forceScrollRef.current) {
      scrollToBottom();
      forceScrollRef.current = false;
      return;
    }

    if (isAtBottom) {
      scrollToBottom();
    }
  }, [isAtBottom, listHeight, messages.length, scrollToBottom]);

  const setSize = useCallback(
    (id: string, size: number) => {
      const map = sizeMapRef.current;
      const previous = map.get(id);
      if (previous === size) {
        return;
      }

      map.set(id, size);
      const index = messages.findIndex((message) => message.id === id);
      if (index >= 0) {
        listRef.current?.resetAfterIndex(index, true);
      }
    },
    [messages],
  );

  const getItemSize = useCallback(
    (index: number) => {
      const message = messages[index];
      if (!message) {
        return 88;
      }
      return sizeMapRef.current.get(message.id) ?? 88;
    },
    [messages],
  );

  const appendOptimisticMessage = useCallback(
    ({
      clientTempId,
      body,
      type,
    }: {
      clientTempId: string;
      body: string;
      type: Message["type"];
    }) => {
      const optimistic: Message = {
        id: clientTempId,
        clientTempId,
        conversationId,
        senderId: viewerId,
        type,
        body,
        createdAt: Date.now(),
        status: "pending",
      };

      forceScrollRef.current = true;
      setMessages((prev) => mergeMessages(prev, optimistic));
    },
    [conversationId, viewerId],
  );

  const resolveMessage = useCallback(
    (event: MessageUpdateEvent & { kind: "ack" }) => {
      setMessages((prev) => mergeMessages(prev, event));
    },
    [],
  );

  const markMessageFailed = useCallback(
    (clientTempId: string, error?: string) => {
      setMessages((prev) => {
        const target = prev.find(
          (message) => message.clientTempId === clientTempId,
        );
        if (!target) {
          return prev;
        }

        const failed: Message = {
          ...target,
          status: "failed",
          error,
        };

        return mergeMessages(prev, { kind: "upsert", message: failed });
      });
    },
    [],
  );

  const contextValue = useMemo<MessageListController>(
    () => ({
      appendOptimisticMessage,
      resolveMessage,
      markMessageFailed,
      viewerId,
    }),
    [appendOptimisticMessage, markMessageFailed, resolveMessage, viewerId],
  );

  const itemData = useMemo<ListItemData>(
    () => ({ messages, viewerId, setSize }),
    [messages, setSize, viewerId],
  );

  const messageKeys: ReadonlyArray<string> = useMemo(
    () => messages.map((message) => message.id),
    [messages],
  );

  return (
    <MessageListContext.Provider value={contextValue}>
      <div ref={containerRef} className="flex min-h-0 flex-1 flex-col">
        <div className="relative flex-1 overflow-hidden">
          {listHeight === 0 ? (
            <div className="text-muted-foreground flex h-full items-center justify-center text-sm">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
              Loading messages…
            </div>
          ) : (
            <VariableSizeList<ListItemData>
              ref={assignListRef}
              outerRef={outerRef}
              className="message-list"
              height={listHeight}
              width="100%"
              itemData={itemData}
              itemCount={messages.length}
              itemSize={getItemSize}
              itemKey={(index: number) =>
                messageKeys[index] ?? `virtual-${index}`
              }
              estimatedItemSize={96}
              overscanCount={6}
            >
              {MessageRow}
            </VariableSizeList>
          )}
          {isLoadingOlder ? (
            <div className="from-background/90 text-muted-foreground pointer-events-none absolute inset-x-0 top-0 flex h-8 items-center justify-center bg-gradient-to-b text-xs">
              Loading older messages…
            </div>
          ) : null}
        </div>
        <div className="border-border bg-card/80 border-t p-4">{children}</div>
      </div>
    </MessageListContext.Provider>
  );
}
