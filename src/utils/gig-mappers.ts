import type { Doc } from "convex/_generated/dataModel";
import type { GigDetail, GigListItem, GigLocation } from "@/types/gigs";

export type ConvexGigRecord = Doc<"gigs">;

export type PublicGigFiltersInput = {
  search?: string;
  category?: GigListItem["category"];
  difficultyLevel?: GigListItem["difficultyLevel"];
  experienceRequired?: GigListItem["experienceRequired"];
  budgetMin?: number;
  budgetMax?: number;
  budgetType?: GigListItem["budget"]["type"];
  currency?: GigListItem["budget"]["currency"];
  isRemoteOnly?: boolean;
  isUrgent?: boolean;
  locationType?: GigLocation["type"];
  skills?: string[];
};

export function normalizePublicGigFilters(
  filters?: PublicGigFiltersInput,
): Record<string, unknown> | undefined {
  if (!filters) {
    return undefined;
  }

  const normalized: Record<string, unknown> = {};

  if (filters.search && filters.search.trim().length > 0) {
    normalized.search = filters.search.trim();
  }

  if (filters.category) {
    normalized.category = filters.category;
  }

  if (filters.difficultyLevel) {
    normalized.difficultyLevel = filters.difficultyLevel;
  }

  if (filters.experienceRequired) {
    normalized.experienceRequired = filters.experienceRequired;
  }

  if (
    typeof filters.budgetMin === "number" &&
    !Number.isNaN(filters.budgetMin)
  ) {
    normalized.budgetMin = filters.budgetMin;
  }

  if (
    typeof filters.budgetMax === "number" &&
    !Number.isNaN(filters.budgetMax)
  ) {
    normalized.budgetMax = filters.budgetMax;
  }

  if (filters.budgetType) {
    normalized.budgetType = filters.budgetType;
  }

  if (filters.currency) {
    normalized.currency = filters.currency;
  }

  if (typeof filters.isRemoteOnly === "boolean") {
    normalized.isRemoteOnly = filters.isRemoteOnly;
  }

  if (typeof filters.isUrgent === "boolean") {
    normalized.isUrgent = filters.isUrgent;
  }

  if (filters.locationType) {
    normalized.locationType = filters.locationType;
  }

  if (filters.skills && filters.skills.length > 0) {
    const skills = filters.skills
      .map((skill) => skill.trim())
      .filter((skill) => skill.length > 0);
    if (skills.length > 0) {
      normalized.skills = skills;
    }
  }

  return Object.keys(normalized).length > 0 ? normalized : undefined;
}

export function mapGigRecordToListItem(gig: ConvexGigRecord): GigListItem {
  return {
    _id: gig._id,
    title: gig.title,
    description: gig.description,
    category: gig.category,
    difficultyLevel: gig.difficultyLevel,
    status: gig.status,
    budget: gig.budget,
    skills: gig.skills,
    deadline: gig.deadline ?? undefined,
    experienceRequired: gig.experienceRequired,
    location: gig.location ?? undefined,
    metadata: gig.metadata ?? undefined,
    _creationTime: gig._creationTime,
    employerId: gig.employerId,
  } satisfies GigListItem;
}
export function mapGigRecordToDetail(gig: ConvexGigRecord): GigDetail {
  const base = mapGigRecordToListItem(gig);

  const responsibilities = buildResponsibilities(gig);
  const requirements = buildRequirements(gig);
  const perks = buildPerks(gig);

  return {
    ...base,
    longDescription: gig.description,
    responsibilities,
    requirements,
    ...(perks.length ? { perks } : {}),
  } satisfies GigDetail;
}

function buildResponsibilities(gig: ConvexGigRecord): string[] {
  const core: string[] = [
    `Deliver high-impact outcomes within the ${gig.category} track`,
    "Collaborate closely with cross-functional teammates",
  ];

  if (gig.metadata?.isUrgent) {
    core.push("Navigate tight timelines and unblock stakeholders quickly");
  } else {
    core.push("Continuously iterate based on feedback and data");
  }

  return core;
}

function buildRequirements(gig: ConvexGigRecord): string[] {
  const normalizedSkills = gig.skills.map((skill) =>
    skill.trim().replace(/^\w/, (char) => char.toUpperCase()),
  );

  const skillStatements = normalizedSkills.map(
    (skill) => `Proficiency in ${skill}`,
  );

  const base = [
    ...skillStatements,
    `Experience operating at ${gig.experienceRequired} level or equivalent`,
  ];

  if (gig.location?.type === "remote" || gig.metadata?.isRemoteOnly) {
    base.push("Comfort working asynchronously across time zones");
  }

  return Array.from(new Set(base));
}

function buildPerks(gig: ConvexGigRecord): string[] {
  const perks: string[] = [];

  if (gig.metadata?.isRemoteOnly) {
    perks.push("Remote-first collaboration");
  }

  if (gig.metadata?.isUrgent) {
    perks.push("Fast-moving, high-visibility engagement");
  }

  if (gig.metadata?.featuredUntil && gig.metadata.featuredUntil > Date.now()) {
    perks.push("Featured opportunity with elevated exposure");
  }

  return perks;
}
