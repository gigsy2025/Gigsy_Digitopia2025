import { format } from "date-fns";
import type { ConversationMeta } from "@/lib/convex/types/convo";

interface ConversationHeaderProps {
  readonly conversation: ConversationMeta;
}

export default function ConversationHeader({
  conversation,
}: ConversationHeaderProps) {
  const lastActivity = conversation.lastMessageAt ?? conversation.createdAt;
  const formatted = format(lastActivity, "PPpp");

  return (
    <header className="border-border bg-card flex flex-col gap-2 rounded-xl border px-4 py-3">
      <div className="flex items-center justify-between">
        <h2 className="text-foreground text-lg font-semibold tracking-tight">
          {conversation.title}
        </h2>
        <span className="text-muted-foreground text-xs font-medium uppercase">
          {conversation.type}
        </span>
      </div>
      <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-xs">
        <span>{conversation.participants.length} participants</span>
        <span aria-hidden>•</span>
        <span>Last activity {formatted}</span>
        {conversation.gigId ? (
          <>
            <span aria-hidden>•</span>
            <span>Gig linked</span>
          </>
        ) : null}
      </div>
    </header>
  );
}
