import { fetchQuery } from "convex/nextjs";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";
import {
  mapConversationList,
  mapMessageList,
  toConversationMeta,
} from "./transformers";
import type {
  ConversationId,
  ConversationListResult,
  ConversationMeta,
  MessagePage,
} from "./types/convo";
import { chatConversations, chatMessages, users } from "./references";

export interface ServerConvexConfig {
  readonly token?: string;
}

export interface ServerConvexClient {
  listConversationsForUser(args?: {
    gigId?: Id<"gigs">;
    limit?: number;
    cursor?: string | null;
  }): Promise<ConversationListResult>;
  getConversationMeta(
    conversationId: ConversationId,
  ): Promise<ConversationMeta>;
  getConversationMessages(args: {
    conversationId: ConversationId;
    limit?: number;
    cursor?: string | null;
  }): Promise<MessagePage>;
  resolveViewerUserId(clerkId: string): Promise<Id<"users">>;
}

function buildFetchOptions(config: ServerConvexConfig) {
  if (!config.token) {
    return undefined;
  }

  return {
    token: config.token,
  } as const;
}

export function getConvexServer(
  config: ServerConvexConfig = {},
): ServerConvexClient {
  const options = buildFetchOptions(config);

  return {
    async listConversationsForUser({ gigId, limit, cursor } = {}) {
      const payload = await fetchQuery(
        chatConversations.getByGig,
        {
          gigId,
          limit,
          cursor: cursor ?? undefined,
        },
        options,
      );

      return mapConversationList(payload);
    },
    async getConversationMeta(conversationId) {
      const doc = await fetchQuery(
        chatConversations.getConversation,
        { conversationId },
        options,
      );

      return toConversationMeta(doc);
    },
    async getConversationMessages({ conversationId, limit, cursor }) {
      const payload = await fetchQuery(
        chatMessages.getMessages,
        {
          conversationId,
          limit,
          cursor: cursor ?? undefined,
        },
        options,
      );

      return mapMessageList(payload);
    },
    async resolveViewerUserId(clerkId) {
      const result = await fetchQuery(
        users.getUserByClerkId,
        { clerkId },
        options,
      );

      if (!result?._id) {
        throw new Error("Viewer user record not found in Convex");
      }

      return result._id;
    },
  };
}

export {
  ConvexProvider,
  useConvexMutation,
  useConvexSubscription,
} from "./client-react";
export { chatConversations, chatMessages, users } from "./references";
