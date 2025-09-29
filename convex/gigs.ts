import { query } from "./_generated/server";
import type { QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { v } from "convex/values";

const CATEGORIES = [
  "design",
  "development",
  "writing",
  "marketing",
  "data",
  "video",
  "audio",
  "business",
  "other",
] as const;

const DIFFICULTY_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
] as const;
const EXPERIENCE_LEVELS = [
  "entry",
  "intermediate",
  "senior",
  "expert",
] as const;
const BUDGET_TYPES = ["fixed", "hourly", "milestone"] as const;
const CURRENCIES = ["EGP", "USD", "EUR"] as const;
const LOCATION_TYPES = ["remote", "onsite", "hybrid"] as const;

const DEFAULT_LIST_LIMIT = 30;
const MAX_LIST_LIMIT = 60;

type PublicGig = Doc<"gigs">;

type PublicGigFilters = {
  search?: string;
  category?: (typeof CATEGORIES)[number];
  difficultyLevel?: (typeof DIFFICULTY_LEVELS)[number];
  experienceRequired?: (typeof EXPERIENCE_LEVELS)[number];
  budgetMin?: number;
  budgetMax?: number;
  budgetType?: (typeof BUDGET_TYPES)[number];
  currency?: (typeof CURRENCIES)[number];
  isRemoteOnly?: boolean;
  isUrgent?: boolean;
  locationType?: (typeof LOCATION_TYPES)[number];
  skills?: string[];
};

interface PaginatedGigsResult {
  items: PublicGig[];
  continueCursor: string | null;
  isDone: boolean;
}

function clampLimit(limit?: number | null): number {
  if (!limit || Number.isNaN(limit)) {
    return DEFAULT_LIST_LIMIT;
  }
  return Math.max(1, Math.min(limit, MAX_LIST_LIMIT));
}

function createOpenGigsQuery(ctx: QueryCtx, filters: PublicGigFilters) {
  if (filters.category) {
    return ctx.db
      .query("gigs")
      .withIndex("by_status_category", (q) =>
        q.eq("status", "open").eq("category", filters.category!),
      );
  }

  return ctx.db
    .query("gigs")
    .withIndex("by_status", (q) => q.eq("status", "open"));
}

function matchesFilters(gig: PublicGig, filters: PublicGigFilters): boolean {
  if (
    filters.difficultyLevel &&
    gig.difficultyLevel !== filters.difficultyLevel
  ) {
    return false;
  }

  if (
    filters.experienceRequired &&
    gig.experienceRequired !== filters.experienceRequired
  ) {
    return false;
  }

  if (
    typeof filters.budgetMin === "number" &&
    gig.budget.max < filters.budgetMin
  ) {
    return false;
  }

  if (
    typeof filters.budgetMax === "number" &&
    gig.budget.min > filters.budgetMax
  ) {
    return false;
  }

  if (filters.budgetType && gig.budget.type !== filters.budgetType) {
    return false;
  }

  if (filters.currency && gig.budget.currency !== filters.currency) {
    return false;
  }

  if (filters.locationType && gig.location?.type !== filters.locationType) {
    return false;
  }

  if (filters.isRemoteOnly) {
    const isRemote =
      gig.location?.type === "remote" || gig.metadata?.isRemoteOnly === true;
    if (!isRemote) {
      return false;
    }
  }

  if (filters.isUrgent && gig.metadata?.isUrgent !== true) {
    return false;
  }

  if (filters.skills && filters.skills.length > 0) {
    const gigSkills = new Set(gig.skills.map((skill) => skill.toLowerCase()));
    const hasAllSkills = filters.skills.every((skill) =>
      gigSkills.has(skill.toLowerCase()),
    );
    if (!hasAllSkills) {
      return false;
    }
  }

  if (filters.search) {
    const needle = filters.search.trim().toLowerCase();
    const haystack = [
      gig.title,
      gig.description,
      gig.category,
      ...gig.skills,
      gig.location?.city ?? "",
      gig.location?.country ?? "",
    ]
      .join(" ")
      .toLowerCase();

    if (!haystack.includes(needle)) {
      return false;
    }
  }

  return true;
}

function sanitizeGig(gig: PublicGig) {
  return {
    _id: gig._id,
    title: gig.title,
    description: gig.description,
    category: gig.category,
    difficultyLevel: gig.difficultyLevel,
    status: gig.status,
    budget: gig.budget,
    skills: gig.skills,
    estimatedDuration: gig.estimatedDuration,
    applicationDeadline: gig.applicationDeadline,
    experienceRequired: gig.experienceRequired,
    location: gig.location,
    metadata: gig.metadata,
    employerId: gig.employerId,
    updatedAt: gig.updatedAt,
    _creationTime: gig._creationTime,
  } satisfies PublicGig;
}

async function collectPaginatedOpenGigs(
  ctx: QueryCtx,
  filters: PublicGigFilters,
  limit: number,
  cursor: string | null,
): Promise<PaginatedGigsResult> {
  const query = createOpenGigsQuery(ctx, filters);

  let nextCursor: string | null = cursor ?? null;
  const collected: PublicGig[] = [];
  let isDone = false;
  let iterations = 0;
  const MAX_ITERATIONS = 12;

  while (collected.length < limit && !isDone && iterations < MAX_ITERATIONS) {
    const page = await query.paginate({
      cursor: nextCursor,
      numItems: limit,
    });

    for (const gig of page.page) {
      if (matchesFilters(gig, filters)) {
        collected.push(gig);
        if (collected.length >= limit) {
          break;
        }
      }
    }

    isDone = page.isDone;
    nextCursor = page.continueCursor ?? null;
    iterations += 1;

    if (!page.continueCursor) {
      break;
    }
  }

  return {
    items: collected,
    continueCursor: !isDone && collected.length >= limit ? nextCursor : null,
    isDone,
  };
}

export const list = query({
  args: {
    filters: v.optional(
      v.object({
        search: v.optional(v.string()),
        category: v.optional(
          v.union(...CATEGORIES.map((category) => v.literal(category))),
        ),
        difficultyLevel: v.optional(
          v.union(...DIFFICULTY_LEVELS.map((level) => v.literal(level))),
        ),
        experienceRequired: v.optional(
          v.union(...EXPERIENCE_LEVELS.map((level) => v.literal(level))),
        ),
        budgetMin: v.optional(v.number()),
        budgetMax: v.optional(v.number()),
        budgetType: v.optional(
          v.union(...BUDGET_TYPES.map((type) => v.literal(type))),
        ),
        currency: v.optional(
          v.union(...CURRENCIES.map((currency) => v.literal(currency))),
        ),
        isRemoteOnly: v.optional(v.boolean()),
        isUrgent: v.optional(v.boolean()),
        locationType: v.optional(
          v.union(...LOCATION_TYPES.map((location) => v.literal(location))),
        ),
        skills: v.optional(v.array(v.string())),
      }),
    ),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const filters = args.filters ?? {};
    const limit = clampLimit(args.limit);
    const cursor = args.cursor ?? null;

    const { items, continueCursor } = await collectPaginatedOpenGigs(
      ctx,
      filters,
      limit,
      cursor,
    );

    const sanitized = items.map(sanitizeGig);

    sanitized.sort(
      (left, right) =>
        (right.metadata?.publishedAt ?? right._creationTime) -
        (left.metadata?.publishedAt ?? left._creationTime),
    );

    return {
      items: sanitized,
      continueCursor,
    } satisfies {
      items: ReturnType<typeof sanitizeGig>[];
      continueCursor: string | null;
    };
  },
});

export const get = query({
  args: {
    gigId: v.id("gigs"),
  },
  handler: async (ctx, { gigId }) => {
    const gig = await ctx.db.get(gigId);
    if (!gig || gig.status !== "open") {
      return null;
    }

    return sanitizeGig(gig);
  },
});

export const related = query({
  args: {
    gigId: v.id("gigs"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { gigId, limit }) => {
    const anchor = await ctx.db.get(gigId);
    if (!anchor || anchor.status !== "open") {
      return [];
    }

    const desired = clampLimit(limit ?? 6);
    const seen = new Set<Id<"gigs">>([anchor._id]);
    const relatedGigs: PublicGig[] = [];

    let cursor: string | null = null;
    let isDone = false;

    while (relatedGigs.length < desired && !isDone) {
      const page = await ctx.db
        .query("gigs")
        .withIndex("by_status", (q) => q.eq("status", "open"))
        .paginate({ cursor, numItems: desired });

      for (const gig of page.page) {
        if (seen.has(gig._id)) {
          continue;
        }

        const sameCategory = gig.category === anchor.category;
        if (!sameCategory && relatedGigs.length >= desired / 2) {
          continue;
        }

        relatedGigs.push(gig);
        seen.add(gig._id);

        if (relatedGigs.length >= desired) {
          break;
        }
      }

      cursor = page.continueCursor ?? null;
      isDone = page.isDone || cursor === null;
    }

    const prioritized = relatedGigs
      .map((gig) => ({
        gig,
        priority: gig.category === anchor.category ? 0 : 1,
      }))
      .sort(
        (left, right) =>
          left.priority - right.priority ||
          (right.gig.metadata?.publishedAt ?? right.gig._creationTime) -
            (left.gig.metadata?.publishedAt ?? left.gig._creationTime),
      )
      .slice(0, desired)
      .map(({ gig }) => gig);

    return prioritized.map(sanitizeGig);
  },
});
