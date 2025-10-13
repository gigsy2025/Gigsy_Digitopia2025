import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import type { Doc, Id } from "../_generated/dataModel";
import { ensureConversation } from "../chatConversations";
import type { MutationCtx } from "../_generated/server";

interface ConversationBootstrapContext {
  gig: Doc<"gigs">;
  employer: Doc<"users">;
  candidate: Doc<"users">;
  application: Doc<"applications">;
}

export function resolveCandidateDisplayName(candidate: Doc<"users">): string {
  const displayNameCandidates = [candidate.name, candidate.email];

  for (const value of displayNameCandidates) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "Assigned talent";
}

export function formatContractConversationTitle({
  gig,
  candidate,
}: Pick<ConversationBootstrapContext, "gig" | "candidate">): string {
  const candidateName = resolveCandidateDisplayName(candidate);
  const gigTitle = gig.title?.trim() ?? "Gig";
  return `Contract — ${candidateName} (${gigTitle})`;
}

async function loadBootstrapContext(
  ctx: MutationCtx,
  {
    gigId,
    employerId,
    candidateId,
    applicationId,
  }: {
    gigId: Id<"gigs">;
    employerId: Id<"users">;
    candidateId: Id<"users">;
    applicationId: Id<"applications">;
  },
): Promise<ConversationBootstrapContext> {
  const [gig, employer, candidate, application] = await Promise.all([
    ctx.db.get(gigId),
    ctx.db.get(employerId),
    ctx.db.get(candidateId),
    ctx.db.get(applicationId),
  ]);

  if (!gig) {
    throw new Error("Gig not found for assignment conversation bootstrap");
  }

  if (!employer) {
    throw new Error("Employer not found for assignment conversation bootstrap");
  }

  if (!candidate) {
    throw new Error(
      "Candidate not found for assignment conversation bootstrap",
    );
  }

  if (!application || application.gigId !== gig._id) {
    throw new Error("Application is invalid for gig assignment conversation");
  }

  if (gig.employerId !== employer._id) {
    throw new Error(
      "Employer is not authorized for this gig assignment conversation",
    );
  }

  if (application.candidateId !== candidate._id) {
    throw new Error(
      "Candidate mismatch on application for assignment conversation",
    );
  }

  return { gig, employer, candidate, application };
}

export const ensureAssignmentConversation = internalMutation({
  args: {
    gigId: v.id("gigs"),
    employerId: v.id("users"),
    candidateId: v.id("users"),
    applicationId: v.id("applications"),
  },
  handler: async (ctx, args) => {
    const context = await loadBootstrapContext(ctx, args);

    const conversationId = await ensureConversation(ctx, {
      gigId: context.gig._id,
      type: "contract",
      title: formatContractConversationTitle(context),
      participants: [context.candidate._id],
      meta: {
        applicationId: context.application._id,
      },
      creatorId: context.employer._id,
      auditMetadata: {
        trigger: "gig.assignment",
      },
    });

    return { conversationId };
  },
});
