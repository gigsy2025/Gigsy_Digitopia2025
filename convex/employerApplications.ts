import {
  query,
  mutation,
  type QueryCtx,
  type MutationCtx,
} from "./_generated/server";
import { ConvexError, v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { getUserId } from "./users";

const APPLICATION_STATUS = [
  "pending",
  "viewed",
  "submitted",
  "in_review",
  "shortlisted",
  "interview_requested",
  "rejected",
  "withdrawn",
  "hired",
  "assigned",
  "closed",
] as const;

const PaginationArgs = {
  cursor: v.optional(v.string()),
  limit: v.optional(v.number()),
};

type ApplicationStatus = (typeof APPLICATION_STATUS)[number];

type Ctx = QueryCtx | MutationCtx;

async function requireEmployer(ctx: Ctx, gigId: Id<"gigs">) {
  const employerId = await getUserId(ctx);
  if (!employerId) {
    throw new ConvexError("Not authenticated");
  }

  const gig = await ctx.db.get(gigId);
  if (!gig) {
    throw new ConvexError("Gig not found");
  }

  if (gig.employerId !== employerId) {
    throw new ConvexError("Forbidden");
  }

  return { employerId, gig };
}

export const listByGig = query({
  args: {
    gigId: v.id("gigs"),
    status: v.optional(
      v.union(...APPLICATION_STATUS.map((status) => v.literal(status))),
    ),
    ...PaginationArgs,
  },
  handler: async (ctx, { gigId, status, cursor, limit }) => {
    await requireEmployer(ctx, gigId);

    const pageSize = Math.min(Math.max(limit ?? 25, 1), 100);

    let baseQuery = ctx.db
      .query("applications")
      .withIndex("by_gig", (q) => q.eq("gigId", gigId));

    if (status) {
      baseQuery = baseQuery.filter((q) => q.eq(q.field("status"), status));
    }

    const page = await baseQuery.paginate({
      cursor: cursor ?? null,
      numItems: pageSize,
    });

    const items = await Promise.all(
      page.page.map(async (application) => {
        const candidate = await ctx.db.get(application.candidateId);
        return {
          application,
          candidate: candidate ?? null,
        } as const;
      }),
    );

    return {
      items,
      continueCursor: page.continueCursor,
      isDone: page.isDone,
    } satisfies {
      items: Array<{
        application: Doc<"applications">;
        candidate: Doc<"users"> | null;
      }>;
      continueCursor: string | null;
      isDone: boolean;
    };
  },
});

export const getApplication = query({
  args: {
    gigId: v.id("gigs"),
    applicationId: v.id("applications"),
  },
  handler: async (ctx, { gigId, applicationId }) => {
    await requireEmployer(ctx, gigId);

    const application = await ctx.db.get(applicationId);
    if (!application || application.gigId !== gigId) {
      throw new ConvexError("Application not found");
    }

    const [candidate, events, rawNotes] = await Promise.all([
      ctx.db.get(application.candidateId),
      ctx.db
        .query("applicationStatusEvents")
        .withIndex("by_application", (q) =>
          q.eq("applicationId", applicationId),
        )
        .collect(),
      ctx.db
        .query("employerNotes")
        .withIndex("by_application", (q) =>
          q.eq("applicationId", applicationId),
        )
        .collect(),
    ]);

    events.sort((left, right) => left.createdAt - right.createdAt);
    rawNotes.sort((left, right) => right.createdAt - left.createdAt);

    const authorIds = Array.from(
      new Set(rawNotes.map((note) => note.authorId)),
    );
    const authorDocs = await Promise.all(
      authorIds.map((authorId) => ctx.db.get(authorId)),
    );
    const authorClerkIdByUserId = new Map<Id<"users">, string>(
      authorDocs
        .filter((author): author is Doc<"users"> => Boolean(author?.clerkId))
        .map((author) => [author._id, author.clerkId]),
    );

    const notes = rawNotes.map((note) => ({
      ...note,
      authorClerkId: authorClerkIdByUserId.get(note.authorId) ?? null,
    }));

    return {
      application,
      candidate: candidate ?? null,
      events,
      notes,
    } satisfies {
      application: Doc<"applications">;
      candidate: Doc<"users"> | null;
      events: Doc<"applicationStatusEvents">[];
      notes: Array<Doc<"employerNotes"> & { authorClerkId: string | null }>;
    };
  },
});

export const markViewed = mutation({
  args: {
    applicationId: v.id("applications"),
  },
  handler: async (ctx, { applicationId }) => {
    const application = await ctx.db.get(applicationId);
    if (!application) {
      throw new ConvexError("Application not found");
    }

    const { employerId } = await requireEmployer(ctx, application.gigId);

    if (application.status === "viewed") {
      return application.status as ApplicationStatus;
    }

    if (
      application.status !== "pending" &&
      application.status !== "submitted"
    ) {
      return application.status as ApplicationStatus;
    }

    const timestamp = Date.now();

    await ctx.db.insert("applicationStatusEvents", {
      applicationId,
      status: "viewed",
      changedBy: employerId,
      createdAt: timestamp,
    });

    await ctx.db.patch(applicationId, {
      status: "viewed",
      statusUpdatedAt: timestamp,
      viewedAt: timestamp,
      updatedAt: timestamp,
    });

    return "viewed" as ApplicationStatus;
  },
});

export const updateStatus = mutation({
  args: {
    applicationId: v.id("applications"),
    status: v.union(...APPLICATION_STATUS.map((status) => v.literal(status))),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { applicationId, status, reason }) => {
    const application = await ctx.db.get(applicationId);
    if (!application) {
      throw new ConvexError("Application not found");
    }

    const { employerId } = await requireEmployer(ctx, application.gigId);

    if (application.status === status) {
      return status;
    }

    const timestamp = Date.now();

    await ctx.db.insert("applicationStatusEvents", {
      applicationId,
      status,
      changedBy: employerId,
      reason,
      createdAt: timestamp,
    });

    await ctx.db.patch(applicationId, {
      status,
      statusUpdatedAt: timestamp,
      updatedAt: timestamp,
    });

    return status;
  },
});

export const addNote = mutation({
  args: {
    applicationId: v.id("applications"),
    body: v.string(),
  },
  handler: async (ctx, { applicationId, body }) => {
    const trimmed = body.trim();
    if (!trimmed) {
      throw new ConvexError("Note body must not be empty");
    }

    const application = await ctx.db.get(applicationId);
    if (!application) {
      throw new ConvexError("Application not found");
    }

    const { employerId } = await requireEmployer(ctx, application.gigId);

    const note = {
      applicationId,
      authorId: employerId,
      body: trimmed,
      createdAt: Date.now(),
    } as const;

    await ctx.db.insert("employerNotes", note);

    return note;
  },
});
