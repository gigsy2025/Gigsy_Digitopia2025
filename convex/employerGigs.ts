import { mutation, query } from "./_generated/server";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { getUserId } from "./users";

const GIG_STATUS = [
  "draft",
  "open",
  "in_progress",
  "in_review",
  "completed",
  "cancelled",
  "paused",
] as const;

const BUDGET_TYPE = ["fixed", "hourly", "milestone"] as const;
const CURRENCIES = ["EGP", "USD", "EUR"] as const;
const DURATION_UNITS = ["hours", "days", "weeks", "months"] as const;
const LOCATION_TYPES = ["remote", "onsite", "hybrid"] as const;

const CreateGigArgs = v.object({
  title: v.string(),
  description: v.string(),
  skills: v.array(v.string()),
  category: v.union(
    v.literal("design"),
    v.literal("development"),
    v.literal("writing"),
    v.literal("marketing"),
    v.literal("data"),
    v.literal("video"),
    v.literal("audio"),
    v.literal("business"),
    v.literal("other"),
  ),
  difficultyLevel: v.union(
    v.literal("beginner"),
    v.literal("intermediate"),
    v.literal("advanced"),
    v.literal("expert"),
  ),
  experienceRequired: v.union(
    v.literal("entry"),
    v.literal("intermediate"),
    v.literal("senior"),
    v.literal("expert"),
  ),
  budget: v.object({
    min: v.number(),
    max: v.number(),
    currency: v.union(...CURRENCIES.map((currency) => v.literal(currency))),
    type: v.union(...BUDGET_TYPE.map((type) => v.literal(type))),
  }),
  deadline: v.optional(v.number()),
  applicationDeadline: v.optional(v.number()),
  estimatedDuration: v.optional(
    v.object({
      value: v.number(),
      unit: v.union(...DURATION_UNITS.map((unit) => v.literal(unit))),
    }),
  ),
  location: v.optional(
    v.object({
      type: v.union(...LOCATION_TYPES.map((type) => v.literal(type))),
      city: v.optional(v.string()),
      country: v.optional(v.string()),
      timezone: v.optional(v.string()),
    }),
  ),
  metadata: v.optional(
    v.object({
      isUrgent: v.optional(v.boolean()),
      isRemoteOnly: v.optional(v.boolean()),
      featuredUntil: v.optional(v.number()),
    }),
  ),
});

const UpdateGigArgs = v.object({
  gigId: v.id("gigs"),
  patch: v.object({
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    skills: v.optional(v.array(v.string())),
    category: v.optional(
      v.union(
        v.literal("design"),
        v.literal("development"),
        v.literal("writing"),
        v.literal("marketing"),
        v.literal("data"),
        v.literal("video"),
        v.literal("audio"),
        v.literal("business"),
        v.literal("other"),
      ),
    ),
    difficultyLevel: v.optional(
      v.union(
        v.literal("beginner"),
        v.literal("intermediate"),
        v.literal("advanced"),
        v.literal("expert"),
      ),
    ),
    experienceRequired: v.optional(
      v.union(
        v.literal("entry"),
        v.literal("intermediate"),
        v.literal("senior"),
        v.literal("expert"),
      ),
    ),
    budget: v.optional(
      v.object({
        min: v.optional(v.number()),
        max: v.optional(v.number()),
        currency: v.optional(
          v.union(...CURRENCIES.map((currency) => v.literal(currency))),
        ),
        type: v.optional(
          v.union(...BUDGET_TYPE.map((type) => v.literal(type))),
        ),
      }),
    ),
    deadline: v.optional(v.union(v.number(), v.null())),
    applicationDeadline: v.optional(v.union(v.number(), v.null())),
    estimatedDuration: v.optional(
      v.union(
        v.object({
          value: v.number(),
          unit: v.union(...DURATION_UNITS.map((unit) => v.literal(unit))),
        }),
        v.null(),
      ),
    ),
    location: v.optional(
      v.union(
        v.object({
          type: v.union(...LOCATION_TYPES.map((type) => v.literal(type))),
          city: v.optional(v.string()),
          country: v.optional(v.string()),
          timezone: v.optional(v.string()),
        }),
        v.null(),
      ),
    ),
    status: v.optional(
      v.union(...GIG_STATUS.map((status) => v.literal(status))),
    ),
    metadata: v.optional(
      v.object({
        isUrgent: v.optional(v.boolean()),
        isRemoteOnly: v.optional(v.boolean()),
        featuredUntil: v.optional(v.union(v.number(), v.null())),
      }),
    ),
  }),
  expectedVersion: v.optional(v.number()),
});

const PaginationArgs = {
  cursor: v.optional(v.string()),
  limit: v.optional(v.number()),
};

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

function assertBudget(input: { min: number; max: number }) {
  if (input.min < 0) {
    throw new Error("Budget minimum must be non-negative");
  }

  if (input.max < input.min) {
    throw new Error("Budget maximum must be greater than or equal to minimum");
  }
}

type DbCtx = QueryCtx | MutationCtx;

async function requireEmployer(ctx: DbCtx, gigId: Id<"gigs">) {
  const employerId = await getUserId(ctx);
  if (!employerId) {
    throw new Error("Not authenticated");
  }

  const gig = await ctx.db.get(gigId);
  if (!gig) {
    throw new Error("Gig not found");
  }

  if (gig.employerId !== employerId) {
    throw new Error("Forbidden");
  }

  return { employerId, gig };
}

export const listByEmployer = query({
  args: {
    status: v.optional(
      v.union(...GIG_STATUS.map((status) => v.literal(status))),
    ),
    ...PaginationArgs,
  },
  handler: async (ctx, { status, cursor, limit }) => {
    const employerId = await getUserId(ctx);
    if (!employerId) {
      throw new Error("Not authenticated");
    }

    const pageSize = Math.min(Math.max(limit ?? 20, 1), 100);

    const baseQuery = status
      ? ctx.db
          .query("gigs")
          .withIndex("by_status_employer", (q) =>
            q.eq("status", status).eq("employerId", employerId),
          )
      : ctx.db
          .query("gigs")
          .withIndex("by_employer", (q) => q.eq("employerId", employerId));

    const result = await baseQuery.paginate({
      cursor: cursor ?? null,
      numItems: pageSize,
    });

    return {
      items: result.page,
      continueCursor: result.continueCursor,
      isDone: result.isDone,
    };
  },
});

export const updateApplicationStatus = mutation({
  args: {
    applicationId: v.id("applications"),
    status: v.union(...APPLICATION_STATUS.map((status) => v.literal(status))),
  },
  handler: async (ctx, { applicationId, status }) => {
    const application = await ctx.db.get(applicationId);
    if (!application) {
      throw new Error("Application not found");
    }

    await requireEmployer(ctx, application.gigId);

    if (application.status === status) {
      return status;
    }

    await ctx.db.patch(applicationId, {
      status,
      updatedAt: Date.now(),
    });

    return status;
  },
});

export const getEmployerGig = query({
  args: {
    gigId: v.id("gigs"),
  },
  handler: async (ctx, { gigId }) => {
    const { gig } = await requireEmployer(ctx, gigId);
    return gig;
  },
});

export const getEmployerMetrics = query({
  args: {},
  handler: async (ctx) => {
    const employerId = await getUserId(ctx);
    if (!employerId) {
      throw new Error("Not authenticated");
    }

    const gigs = await ctx.db
      .query("gigs")
      .withIndex("by_employer", (q) => q.eq("employerId", employerId))
      .collect();

    const totalGigs = gigs.length;
    const activeGigs = gigs.filter((gig) => gig.status === "open").length;

    const totalApplicants = gigs.reduce((total, gig) => {
      const count = gig.metadata?.applicantCount ?? 0;
      return total + count;
    }, 0);

    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    let applicationsThisWeek = 0;

    for (const gig of gigs) {
      const applications = await ctx.db
        .query("applications")
        .withIndex("by_gig", (q) => q.eq("gigId", gig._id))
        .collect();

      applicationsThisWeek += applications.filter(
        (application) => application._creationTime >= weekAgo,
      ).length;
    }

    return {
      totalGigs,
      activeGigs,
      totalApplicants,
      applicationsThisWeek,
    };
  },
});

export const listApplicationsByGig = query({
  args: {
    gigId: v.id("gigs"),
    status: v.optional(
      v.union(...APPLICATION_STATUS.map((status) => v.literal(status))),
    ),
    ...PaginationArgs,
  },
  handler: async (ctx, { gigId, status, cursor, limit }) => {
    const { gig } = await requireEmployer(ctx, gigId);
    void gig;

    const pageSize = Math.min(Math.max(limit ?? 50, 1), 100);

    let baseQuery = ctx.db
      .query("applications")
      .withIndex("by_gig", (q) => q.eq("gigId", gigId));

    if (status) {
      baseQuery = baseQuery.filter((q) => q.eq(q.field("status"), status));
    }

    const result = await baseQuery.paginate({
      cursor: cursor ?? null,
      numItems: pageSize,
    });

    const enriched = await Promise.all(
      result.page.map(async (application) => {
        const candidate = await ctx.db.get(application.candidateId);
        return {
          application,
          candidate: candidate ?? null,
        } as const;
      }),
    );

    return {
      items: enriched,
      continueCursor: result.continueCursor,
      isDone: result.isDone,
    };
  },
});

export const createGig = mutation({
  args: {
    input: CreateGigArgs,
  },
  handler: async (ctx, { input }) => {
    const employerId = await getUserId(ctx);
    if (!employerId) {
      throw new Error("Not authenticated");
    }

    assertBudget(input.budget);

    const now = Date.now();

    const metadata: NonNullable<Doc<"gigs">["metadata"]> = {
      views: 0,
      applicantCount: 0,
      savedCount: 0,
      lastModified: now,
      version: 1,
      isUrgent: input.metadata?.isUrgent ?? false,
      isRemoteOnly:
        input.metadata?.isRemoteOnly ?? input.location?.type === "remote",
      featuredUntil: input.metadata?.featuredUntil,
      publishedAt: now,
    };

    const gigId = await ctx.db.insert("gigs", {
      title: input.title,
      description: input.description,
      skills: input.skills,
      category: input.category,
      difficultyLevel: input.difficultyLevel,
      experienceRequired: input.experienceRequired,
      budget: input.budget,
      deadline: input.deadline,
      applicationDeadline: input.applicationDeadline,
      estimatedDuration: input.estimatedDuration ?? undefined,
      location: input.location ?? undefined,
      employerId,
      status: "open",
      metadata,
      updatedAt: now,
    });

    return gigId;
  },
});

export const updateGig = mutation({
  args: UpdateGigArgs,
  handler: async (ctx, { gigId, patch, expectedVersion }) => {
    const { gig } = await requireEmployer(ctx, gigId);

    if (patch.budget) {
      const min = patch.budget.min ?? gig.budget.min;
      const max = patch.budget.max ?? gig.budget.max;
      assertBudget({ min, max });
    }

    const currentMetadata = gig.metadata ?? {
      views: 0,
      applicantCount: 0,
      savedCount: 0,
      lastModified: Date.now(),
      version: 1,
      isUrgent: false,
      isRemoteOnly: false,
    };

    if (
      expectedVersion !== undefined &&
      currentMetadata.version !== expectedVersion
    ) {
      throw new Error(
        "Gig has been updated by another session. Refresh and try again.",
      );
    }

    const now = Date.now();

    const nextMetadata = {
      ...currentMetadata,
      lastModified: now,
      version: currentMetadata.version + 1,
      isUrgent: patch.metadata?.isUrgent ?? currentMetadata.isUrgent ?? false,
      isRemoteOnly:
        patch.metadata?.isRemoteOnly ?? currentMetadata.isRemoteOnly ?? false,
      featuredUntil:
        patch.metadata?.featuredUntil ?? currentMetadata.featuredUntil,
    } satisfies NonNullable<Doc<"gigs">["metadata"]>;

    await ctx.db.patch(gigId, {
      ...(patch.title !== undefined ? { title: patch.title } : {}),
      ...(patch.description !== undefined
        ? { description: patch.description }
        : {}),
      ...(patch.skills !== undefined ? { skills: patch.skills } : {}),
      ...(patch.category !== undefined ? { category: patch.category } : {}),
      ...(patch.difficultyLevel !== undefined
        ? { difficultyLevel: patch.difficultyLevel }
        : {}),
      ...(patch.experienceRequired !== undefined
        ? { experienceRequired: patch.experienceRequired }
        : {}),
      ...(patch.budget !== undefined
        ? {
            budget: {
              min: patch.budget.min ?? gig.budget.min,
              max: patch.budget.max ?? gig.budget.max,
              currency: patch.budget.currency ?? gig.budget.currency,
              type: patch.budget.type ?? gig.budget.type,
            },
          }
        : {}),
      ...(patch.deadline !== undefined
        ? { deadline: patch.deadline ?? undefined }
        : {}),
      ...(patch.applicationDeadline !== undefined
        ? {
            applicationDeadline: patch.applicationDeadline ?? undefined,
          }
        : {}),
      ...(patch.estimatedDuration !== undefined
        ? { estimatedDuration: patch.estimatedDuration ?? undefined }
        : {}),
      ...(patch.location !== undefined
        ? { location: patch.location ?? undefined }
        : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      metadata: nextMetadata,
      updatedAt: now,
    });

    return nextMetadata.version;
  },
});
