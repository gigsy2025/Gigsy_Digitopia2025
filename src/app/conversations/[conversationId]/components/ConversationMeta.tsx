import type { ConversationMeta } from "@/lib/convex/types/convo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ConversationMetaProps {
  readonly conversation: ConversationMeta;
}

function formatParticipant(participantId: string): string {
  return participantId.slice(-6);
}

export default function ConversationMeta({
  conversation,
}: ConversationMetaProps) {
  return (
    <aside className="w-full shrink-0 space-y-4 lg:w-80">
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground text-sm font-semibold">
            Participants
          </CardTitle>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          {conversation.participants.map((participant) => (
            <div
              key={participant}
              className="border-border flex items-center justify-between rounded-lg border border-dashed px-3 py-2"
            >
              <span className="text-foreground font-medium">User</span>
              <span className="font-mono text-xs">
                …{formatParticipant(participant)}
              </span>
            </div>
          ))}
        </CardContent>
      </Card>
      {conversation.meta ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-foreground text-sm font-semibold">
              Metadata
            </CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted max-h-60 overflow-auto rounded-md p-3 text-xs">
              {JSON.stringify(conversation.meta, null, 2)}
            </pre>
          </CardContent>
        </Card>
      ) : null}
    </aside>
  );
}
