/**
 * CONVEX APPLICATIONS SERVICE
 *
 * Candidate application tracking APIs powering the profile applications dashboard.
 */

import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { getUserId } from "./users";

const APPLICATION_STATUS = [
  "submitted",
  "in_review",
  "shortlisted",
  "rejected",
  "hired",
  "withdrawn",
] as const;

type ApplicationStatus = (typeof APPLICATION_STATUS)[number];

export const listByCandidate = query({
  args: {},
  handler: async (ctx) => {
    const candidateId = await getUserId(ctx);
    if (!candidateId) {
      throw new Error("Not authenticated");
    }

    const applications = await ctx.db
      .query("applications")
      .withIndex("by_candidate", (q) => q.eq("candidateId", candidateId))
      .collect();

    type ApplicationView = {
      application: Doc<"applications">;
      gig: Doc<"gigs">;
    };

    const hydrated: ApplicationView[] = [];

    for (const application of applications) {
      const gig = await ctx.db.get(application.gigId);
      if (!gig) {
        continue;
      }

      hydrated.push({
        application,
        gig,
      });
    }

    return hydrated;
  },
});

export const updateStatus = mutation({
  args: {
    applicationId: v.id("applications"),
    status: v.union(
      v.literal("submitted"),
      v.literal("in_review"),
      v.literal("shortlisted"),
      v.literal("rejected"),
      v.literal("hired"),
      v.literal("withdrawn"),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(args.applicationId, {
      status: args.status,
      updatedAt: Date.now(),
    });
  },
});

export const withdraw = mutation({
  args: {
    applicationId: v.id("applications"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(args.applicationId, {
      status: "withdrawn",
      updatedAt: Date.now(),
    });
  },
});
