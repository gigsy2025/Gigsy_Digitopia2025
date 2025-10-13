import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { ConversationId, UserId } from "@/lib/convex/types/convo";
import { getConvexServer } from "@/lib/convex/client";
import { resolveCurrentUser } from "@/lib/auth/userResolver.server";
import { getInitials } from "@/utils/format";
import type { ConversationDisplayProfile } from "../types";
import ConversationHeader from "./components/ConversationHeader";
import ConversationMetaPanel from "./components/ConversationMeta";
import MessageListClient from "./components/MessageListClient";
import MessageComposer from "./components/MessageComposer";

interface ConversationPageProps {
  readonly params: Promise<{ conversationId: string }>;
}

export default async function ConversationPage({
  params,
}: ConversationPageProps) {
  const { conversationId } = await params;
  const { userId, getToken } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const viewerProfile = await resolveCurrentUser();
  if (!viewerProfile) {
    redirect("/sign-in");
  }

  const token = (await getToken?.({ template: "convex" })) ?? undefined;
  if (!token) {
    redirect("/sign-in");
  }

  const convex = getConvexServer({ token });
  const conversation = await convex.getConversationMeta(
    conversationId as ConversationId,
  );

  const initialMessages = await convex.getConversationMessages({
    conversationId: conversation.id,
    limit: 40,
  });

  const viewerUserId: UserId = await convex.resolveViewerUserId(userId);

  const otherParticipantIds = conversation.participants.filter(
    (participantId) => participantId !== viewerUserId,
  );

  const participantProfiles = await convex.getUserProfiles(otherParticipantIds);

  const primaryParticipant = participantProfiles[0] ?? null;
  const additionalCount = Math.max(participantProfiles.length - 1, 0);

  let profileIdentity: ConversationDisplayProfile;

  if (primaryParticipant) {
    const displayName =
      additionalCount > 0
        ? `${primaryParticipant.name} +${additionalCount}`
        : primaryParticipant.name;

    profileIdentity = {
      name: displayName,
      initials: getInitials(displayName) || "??",
      avatarUrl: primaryParticipant.avatarUrl,
      description:
        additionalCount > 0
          ? `Includes ${additionalCount} other participant${
              additionalCount === 1 ? "" : "s"
            }`
          : undefined,
    };
  } else {
    const viewerDisplayName =
      viewerProfile.name ??
      viewerProfile.username ??
      viewerProfile.email ??
      "You";

    profileIdentity = {
      name: viewerDisplayName,
      initials: getInitials(viewerDisplayName) || "YOU",
      avatarUrl: viewerProfile.avatar ?? null,
    };
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6 lg:flex-row">
      <div className="flex min-h-0 flex-1 flex-col gap-4">
        <ConversationHeader
          conversation={conversation}
          profile={profileIdentity}
        />
        <div className="border-border bg-card flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border">
          <MessageListClient
            viewerId={viewerUserId}
            conversationId={conversation.id}
            initialMessages={initialMessages.messages}
            initialCursor={initialMessages.continueCursor}
            initialIsDone={initialMessages.isDone}
          >
            <MessageComposer conversationId={conversation.id} />
          </MessageListClient>
        </div>
      </div>
      <ConversationMetaPanel conversation={conversation} />
    </div>
  );
}
