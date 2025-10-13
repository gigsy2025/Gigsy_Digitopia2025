import { mutation, query } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { Id, Doc } from "./_generated/dataModel";
import { getUserId } from "./users";

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 100;

const AttachmentValidator = v.object({
  storageId: v.id("_storage"),
  url: v.string(),
  name: v.string(),
  contentType: v.string(),
  size: v.number(),
});

const MessageMetaValidator = v.object({
  deliveryId: v.optional(v.string()),
  readBy: v.optional(v.array(v.id("users"))),
});

const SystemEventValidator = v.union(
  v.literal("work.submitted"),
  v.literal("work.approved"),
  v.literal("work.revision_requested"),
);

function clampLimit(limit?: number | null): number {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.max(1, Math.min(limit, MAX_PAGE_SIZE));
}

function ensureParticipant(
  conversation: Doc<"conversations">,
  userId: Id<"users">,
) {
  if (!conversation.participants.includes(userId)) {
    throw new ConvexError("Unauthorized");
  }
}

function sortAscending<T extends { createdAt: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.createdAt - b.createdAt);
}

type PaginatedMessages = {
  page: Array<Doc<"messages">>;
  isDone: boolean;
  continueCursor: string | null;
};

export const getMessages = query({
  args: {
    conversationId: v.id("conversations"),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (
    ctx,
    { conversationId, cursor, limit },
  ): Promise<PaginatedMessages> => {
    const viewerId = await getUserId(ctx);
    if (!viewerId) {
      throw new ConvexError("Not authenticated");
    }

    const conversation = await ctx.db.get(conversationId);
    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    ensureParticipant(conversation, viewerId);

    const pageSize = clampLimit(limit);
    const { page, isDone, continueCursor } = await ctx.db
      .query("messages")
      .withIndex("by_conversation_desc", (q) =>
        q.eq("conversationId", conversationId),
      )
      .paginate({ cursor: cursor ?? null, numItems: pageSize });

    const sortedPage = sortAscending(page);

    return {
      page: sortedPage,
      isDone,
      continueCursor: continueCursor ?? null,
    };
  },
});

export const sendMessage = mutation({
  args: {
    conversationId: v.id("conversations"),
    messageType: v.union(
      v.literal("text"),
      v.literal("file"),
      v.literal("system"),
    ),
    body: v.optional(v.string()),
    attachments: v.optional(v.array(AttachmentValidator)),
    systemEvent: v.optional(SystemEventValidator),
    meta: v.optional(MessageMetaValidator),
  },
  handler: async (
    ctx,
    { conversationId, messageType, body, attachments, systemEvent, meta },
  ) => {
    const senderId = await getUserId(ctx);
    if (!senderId) {
      throw new ConvexError("Not authenticated");
    }

    const conversation = await ctx.db.get(conversationId);
    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    ensureParticipant(conversation, senderId);

    if (messageType === "text" && (!body || body.trim().length === 0)) {
      throw new ConvexError("Message body is required for text messages");
    }

    if (messageType === "file" && (!attachments || attachments.length === 0)) {
      throw new ConvexError("Attachments are required for file messages");
    }

    if (messageType === "system" && !systemEvent) {
      throw new ConvexError("System messages require a systemEvent");
    }

    const now = Date.now();

    const messageId = await ctx.db.insert("messages", {
      conversationId,
      senderId,
      messageType,
      systemEvent,
      body: body?.trim() ?? undefined,
      attachments: attachments?.length ? attachments : undefined,
      meta,
      createdAt: now,
    });

    await ctx.db.patch(conversationId, {
      lastMessageAt: now,
    });

    const link = await ctx.db
      .query("userConversations")
      .withIndex("by_user_conversation", (q) =>
        q.eq("userId", senderId).eq("conversationId", conversationId),
      )
      .unique();

    if (link) {
      await ctx.db.patch(link._id, {
        lastReadMessageId: messageId,
        lastReadAt: now,
      });
    }

    return messageId;
  },
});
