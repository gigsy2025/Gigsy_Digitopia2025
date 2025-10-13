import type { ConversationMeta, UserId } from "@/lib/convex/types/convo";
import { getInitials } from "@/utils/format";
import type {
  ConversationDisplayProfile,
  ParticipantProfileLookup,
  ConversationParticipantProfile,
} from "../types";

interface DeriveDisplayParams {
  readonly conversation: ConversationMeta;
  readonly viewerId: UserId;
  readonly profiles: ParticipantProfileLookup;
  readonly viewerFallback?: ConversationParticipantProfile;
}

export function deriveConversationDisplayProfile({
  conversation,
  viewerId,
  profiles,
  viewerFallback,
}: DeriveDisplayParams): ConversationDisplayProfile {
  const otherParticipantIds = conversation.participants.filter(
    (participantId) => participantId !== viewerId,
  );

  if (otherParticipantIds.length > 0) {
    const primaryId = otherParticipantIds[0]!;
    const restIds = otherParticipantIds.slice(1);
    const primaryProfile = profiles[primaryId] ?? null;

    const displayName = buildDisplayName(primaryProfile, restIds.length);
    const description = buildDescription(restIds.length);

    return {
      name: displayName,
      initials: getInitials(displayName) || "??",
      avatarUrl: primaryProfile?.avatarUrl ?? null,
      description,
    };
  }

  const fallback: ConversationParticipantProfile = viewerFallback ?? {
    id: viewerId,
    name: conversation.title,
    avatarUrl: null,
  };
  const initials = getInitials(fallback.name) || "YOU";

  return {
    name: fallback.name,
    initials,
    avatarUrl: fallback.avatarUrl,
  };
}

function buildDisplayName(
  primaryProfile: ConversationParticipantProfile | null,
  additionalCount: number,
): string {
  const baseName = primaryProfile?.name ?? "Conversation";
  return additionalCount > 0 ? `${baseName} +${additionalCount}` : baseName;
}

function buildDescription(additionalCount: number): string | undefined {
  if (additionalCount <= 0) {
    return undefined;
  }

  const suffix = additionalCount === 1 ? "" : "s";
  return `Includes ${additionalCount} other participant${suffix}`;
}
