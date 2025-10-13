"use client";

import {
  useCallback,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useConvexMutation } from "@/lib/convex/client-react";
import { chatMessages } from "@/lib/convex/references";
import type { ConversationId } from "@/lib/convex/types/convo";
import { useMessageListActions } from "./MessageListClient";

interface MessageComposerProps {
  readonly conversationId: ConversationId;
}

function generateTempId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `tmp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function MessageComposer({
  conversationId,
}: MessageComposerProps) {
  const [body, setBody] = useState("");
  const [isSending, setIsSending] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const sendMessage = useConvexMutation(chatMessages.sendMessage);
  const { appendOptimisticMessage, resolveMessage, markMessageFailed } =
    useMessageListActions();

  const focusTextarea = useCallback(() => {
    textareaRef.current?.focus();
  }, []);

  const submitMessage = useCallback(async () => {
    const trimmed = body.trim();
    if (!trimmed) {
      return;
    }

    const clientTempId = generateTempId();
    appendOptimisticMessage({
      clientTempId,
      body: trimmed,
      type: "text",
    });

    setBody("");
    setIsSending(true);

    try {
      const messageId = await sendMessage({
        conversationId,
        messageType: "text",
        body: trimmed,
      });

      resolveMessage({
        kind: "ack",
        clientTempId,
        messageId,
        payload: { status: "sent" },
      });
    } catch (error) {
      const description =
        error instanceof Error ? error.message : "Unexpected error";
      markMessageFailed(clientTempId, description);
      console.error("Failed to send message", error);
    } finally {
      setIsSending(false);
      focusTextarea();
    }
  }, [
    appendOptimisticMessage,
    body,
    conversationId,
    focusTextarea,
    markMessageFailed,
    resolveMessage,
    sendMessage,
  ]);

  const handleSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void submitMessage();
    },
    [submitMessage],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void submitMessage();
      }
    },
    [submitMessage],
  );

  return (
    <form onSubmit={handleSubmit} className="flex w-full flex-col gap-3">
      <Textarea
        ref={textareaRef}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Write a message"
        rows={1}
        className="min-h-[48px] resize-none"
        aria-label="Message"
      />
      <div className="flex items-center justify-between gap-3">
        <span className="text-muted-foreground text-xs">
          Press Enter to send, Shift + Enter for a new line
        </span>
        <Button type="submit" size="sm" disabled={isSending || !body.trim()}>
          <Send className="mr-2 h-4 w-4" aria-hidden />
          Send
        </Button>
      </div>
    </form>
  );
}
