import { api } from "convex/_generated/api";
import type { FunctionReference } from "convex/server";
import type { Doc, Id } from "convex/_generated/dataModel";
import type { RawConversationList, RawMessageList } from "./transformers";

interface ChatConversationsModule {
  readonly getByGig: FunctionReference<
    "query",
    "public",
    {
      gigId?: Id<"gigs">;
      limit?: number;
      cursor?: string;
    },
    RawConversationList
  >;
  readonly getConversation: FunctionReference<
    "query",
    "public",
    { conversationId: Id<"conversations"> },
    Doc<"conversations">
  >;
}

interface ChatMessagesModule {
  readonly getMessages: FunctionReference<
    "query",
    "public",
    {
      conversationId: Id<"conversations">;
      cursor?: string;
      limit?: number;
    },
    RawMessageList
  >;
  readonly sendMessage: FunctionReference<
    "mutation",
    "public",
    {
      conversationId: Id<"conversations">;
      messageType: Doc<"messages">["messageType"];
      body?: string;
      attachments?: NonNullable<Doc<"messages">["attachments"]>;
      systemEvent?: Doc<"messages">["systemEvent"];
      meta?: Doc<"messages">["meta"];
    },
    Id<"messages">
  >;
}

interface UsersModule {
  readonly getUserByClerkId: FunctionReference<
    "query",
    "public",
    { clerkId: string },
    { _id: Id<"users"> } | null
  >;
}

const enhancedApi = api as unknown as {
  chatConversations: ChatConversationsModule;
  chatMessages: ChatMessagesModule;
  users: UsersModule;
};

export const chatConversations = enhancedApi.chatConversations;
export const chatMessages = enhancedApi.chatMessages;
export const users = enhancedApi.users;
