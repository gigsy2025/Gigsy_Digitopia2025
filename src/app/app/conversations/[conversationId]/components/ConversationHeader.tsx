import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { ConversationMeta } from "@/lib/convex/types/convo";
import type { ConversationDisplayProfile } from "../../types";

interface ConversationHeaderProps {
  readonly conversation: ConversationMeta;
  readonly profile: ConversationDisplayProfile;
}

export default function ConversationHeader({
  conversation,
  profile,
}: ConversationHeaderProps) {
  const lastActivity = conversation.lastMessageAt ?? conversation.createdAt;
  const formatted = format(lastActivity, "PPpp");

  return (
    <header className="border-border bg-card flex flex-col gap-3 rounded-xl border px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar className="border-border size-10 border">
            <AvatarImage
              src={profile.avatarUrl ?? undefined}
              alt={`${profile.name}'s profile picture`}
            />
            <AvatarFallback>{profile.initials}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col">
            <h2 className="text-foreground truncate text-lg font-semibold tracking-tight">
              {conversation.title}
            </h2>
            <span className="text-muted-foreground text-xs">
              Chatting with {profile.name}
            </span>
            {profile.description ? (
              <span className="text-muted-foreground mt-0.5 text-[11px]">
                {profile.description}
              </span>
            ) : null}
          </div>
        </div>
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
