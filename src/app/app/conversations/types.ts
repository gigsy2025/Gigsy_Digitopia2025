import type { UserId } from "@/lib/convex/types/convo";

export interface ConversationDisplayProfile {
  readonly name: string;
  readonly initials: string;
  readonly avatarUrl: string | null;
  readonly description?: string;
}

export interface ConversationParticipantProfile {
  readonly id: UserId;
  readonly name: string;
  readonly avatarUrl: string | null;
}

export type ParticipantProfileLookup = Partial<
  Record<UserId, ConversationParticipantProfile>
>;
