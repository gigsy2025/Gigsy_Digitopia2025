import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx } from "./_generated/server";
import { ConvexError, v } from "convex/values";
import { getUserId } from "./users";

const DEFAULT_PAGE_SIZE = 25;
const MAX_PAGE_SIZE = 50;

export interface EnsureConversationParams {
  gigId?: Id<"gigs">;
  type: Doc<"conversations">["type"];
  title: string;
  participants: ReadonlyArray<Id<"users">>;
  meta?: Doc<"conversations">["meta"];
  creatorId: Id<"users">;
  auditMetadata?: Record<string, unknown>;
}

const CANONICAL_PARTICIPANT_SEPARATOR = "#";

export function buildCanonicalKey(
  participantIds: ReadonlyArray<Id<"users">>,
  gigId?: Id<"gigs">,
): string {
  const sortedIds = [...participantIds].sort((left, right) =>
    left.localeCompare(right),
  );
  const baseKey = sortedIds.join(CANONICAL_PARTICIPANT_SEPARATOR);
  return gigId ? `${baseKey}|${gigId}` : baseKey;
}

async function ensureUserConversationLinks(
  ctx: MutationCtx,
  conversationId: Id<"conversations">,
  participantIds: ReadonlyArray<Id<"users">>,
) {
  const existingLinks = await ctx.db
    .query("userConversations")
    .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
    .collect();

  const linkedParticipantIds = new Set(
    existingLinks.map((link) => link.userId.toString()),
  );
  const now = Date.now();

  for (const participantId of participantIds) {
    if (linkedParticipantIds.has(participantId.toString())) {
      continue;
    }

    await ctx.db.insert("userConversations", {
      userId: participantId,
      conversationId,
      lastReadAt: now,
    });
  }
}

export async function ensureConversation(
  ctx: MutationCtx,
  {
    gigId,
    type,
    title,
    participants,
    meta,
    creatorId,
    auditMetadata,
  }: EnsureConversationParams,
): Promise<Id<"conversations">> {
  const normalizedParticipants = Array.from(
    new Set([...participants, creatorId]),
  );
  const canonicalKey = buildCanonicalKey(normalizedParticipants, gigId);

  const existing = await ctx.db
    .query("conversations")
    .withIndex("by_canonical_key", (q) => q.eq("canonicalKey", canonicalKey))
    .first();

  if (existing) {
    const updates: Partial<Doc<"conversations">> = {};
    if (title && existing.title !== title) {
      updates.title = title;
    }

    if (gigId && existing.gigId !== gigId) {
      updates.gigId = gigId;
    }

    if (meta) {
      const nextMeta = {
        ...(existing.meta ?? {}),
        ...meta,
      } as Doc<"conversations">["meta"];

      const metaChanged =
        JSON.stringify(existing.meta ?? {}) !== JSON.stringify(nextMeta);
      if (metaChanged) {
        updates.meta = nextMeta;
      }
    }

    if (Object.keys(updates).length > 0) {
      await ctx.db.patch(existing._id, updates);
    }

    await ensureUserConversationLinks(
      ctx,
      existing._id,
      normalizedParticipants,
    );

    return existing._id;
  }

  const now = Date.now();

  const conversationId = await ctx.db.insert("conversations", {
    gigId,
    type,
    title,
    participants: normalizedParticipants,
    canonicalKey,
    createdBy: creatorId,
    meta,
    createdAt: now,
    lastMessageAt: now,
  });

  await ensureUserConversationLinks(
    ctx,
    conversationId,
    normalizedParticipants,
  );

  await ctx.db.insert("chatAuditLogs", {
    conversationId,
    gigId,
    actorId: creatorId,
    eventType: "conversation.created",
    metadata: {
      source: "chat.conversations.ensureConversation",
      type,
      participantCount: normalizedParticipants.length,
      ...(auditMetadata ?? {}),
    },
    createdAt: now,
  });

  return conversationId;
}

/**
 * Clamp the requested page size to an acceptable window.
 * Ensures performance and guards against abuse while keeping UX responsive.
 */
function clampLimit(limit?: number | null): number {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_PAGE_SIZE;
  }

  return Math.max(1, Math.min(limit, MAX_PAGE_SIZE));
}

type PaginatedConversations = {
  page: Array<Doc<"conversations">>;
  isDone: boolean;
  continueCursor: string | null;
};

/**
 * Utility to sort conversations so the newest activity is shown first.
 * Keeps rendering deterministic without mutating the original array.
 */
function sortByLastMessageDesc(conversations: Array<Doc<"conversations">>) {
  return [...conversations].sort(
    (a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0),
  );
}

/**
 * List conversations relevant to the viewer.
 * - When `gigId` is provided, returns conversations scoped to that gig.
 * - Otherwise returns the viewer's entire inbox (via `userConversations` join table).
 * Results are paginated with cursor-based navigation for scalability.
 */
export const getByGig = query({
  args: {
    gigId: v.optional(v.id("gigs")),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (
    ctx,
    { gigId, limit, cursor },
  ): Promise<PaginatedConversations> => {
    const viewerId = await getUserId(ctx);
    if (!viewerId) {
      throw new ConvexError("Not authenticated");
    }

    const pageSize = clampLimit(limit);

    if (gigId) {
      const cursorValue = cursor ?? null;
      const { page, isDone, continueCursor } = await ctx.db
        .query("conversations")
        .withIndex("by_gig_recent", (q) => q.eq("gigId", gigId))
        .paginate({ cursor: cursorValue, numItems: pageSize });

      const filteredPage = sortByLastMessageDesc(
        page.filter((conversation) =>
          conversation.participants.includes(viewerId),
        ),
      );

      return {
        page: filteredPage,
        isDone,
        continueCursor: continueCursor ?? null,
      };
    }

    const cursorValue = cursor ?? null;
    const { page, isDone, continueCursor } = await ctx.db
      .query("userConversations")
      .withIndex("by_user_recent", (q) => q.eq("userId", viewerId))
      .paginate({ cursor: cursorValue, numItems: pageSize });

    const conversations = await Promise.all(
      page.map(async (link) => ctx.db.get(link.conversationId)),
    );

    const filteredPage = sortByLastMessageDesc(
      conversations.filter(Boolean) as Array<Doc<"conversations">>,
    );

    return {
      page: filteredPage,
      isDone,
      continueCursor: continueCursor ?? null,
    };
  },
});

/**
 * Fetch a single conversation ensuring the requester participates in it.
 * Provides a guardrail so no one can access a chat they are not a member of.
 */
export const getConversation = query({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, { conversationId }) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const conversation = await ctx.db.get(conversationId);
    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    if (!conversation.participants.includes(userId)) {
      throw new ConvexError("Unauthorized");
    }

    return conversation;
  },
});

/**
 * Create a conversation (gig-scoped or global) while deduplicating via canonicalKey.
 * Automatically adds the creator to the participant list and bootstraps user link rows.
 */
export const createConversation = mutation({
  args: {
    gigId: v.optional(v.id("gigs")),
    type: v.union(
      v.literal("application"),
      v.literal("contract"),
      v.literal("support"),
      v.literal("mentor"),
      v.literal("direct"),
    ),
    title: v.string(),
    participants: v.array(v.id("users")),
    meta: v.optional(
      v.object({
        applicationId: v.optional(v.id("applications")),
        deliverableId: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, { gigId, type, title, participants, meta }) => {
    const creatorId = await getUserId(ctx);
    if (!creatorId) {
      throw new ConvexError("Not authenticated");
    }

    const conversationId = await ensureConversation(ctx, {
      gigId,
      type,
      title,
      participants,
      meta,
      creatorId,
      auditMetadata: {
        source: "public.createConversation",
      },
    });

    return conversationId;
  },
});

/**
 * Soft-archive a conversation for all participants.
 * Verifies membership before writing audit logs and setting `archivedAt`.
 */
export const archiveConversation = mutation({
  args: {
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, { conversationId }) => {
    const userId = await getUserId(ctx);
    if (!userId) {
      throw new ConvexError("Not authenticated");
    }

    const conversation = await ctx.db.get(conversationId);
    if (!conversation) {
      throw new ConvexError("Conversation not found");
    }

    if (!conversation.participants.includes(userId)) {
      throw new ConvexError("Unauthorized");
    }

    const now = Date.now();

    await ctx.db.patch(conversationId, {
      archivedAt: now,
    });

    await ctx.db.insert("chatAuditLogs", {
      conversationId,
      gigId: conversation.gigId,
      actorId: userId,
      eventType: "conversation.archived",
      createdAt: now,
    });
  },
});
