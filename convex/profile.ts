import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  ProfileCreationInputSchema,
  sanitizeProfileCreationInput,
  fallbackSlugCandidates,
  type SanitizedProfileCreationInput,
} from "../shared/profile/profileCreationSchema";

type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "expert";
type ContractType = "freelance" | "part-time" | "full-time";
type Visibility = "public" | "platform" | "private";
type LanguageLevel = "basic" | "conversational" | "fluent" | "native";

type ProfileSummary = {
  userId: Id<"users">;
  slug: string;
  fullName: string;
  headline?: string;
  location?: {
    city?: string;
    country?: string;
    timezone?: string;
  };
  avatarUrl?: string;
  coverImageUrl?: string;
  experienceLevel?: ExperienceLevel;
  stats: {
    completeness?: number;
    lessonsCompleted?: number;
    lastUpdated?: string;
  };
  availability?: {
    hoursPerWeek?: number;
    contractType?: ContractType;
    availableFrom?: string;
  };
  visibility: Visibility;
  social?: {
    websiteUrl?: string;
    githubUrl?: string;
    linkedinUrl?: string;
  };
};

type ProfileAboutSection = {
  bio?: string;
  highlights?: string[];
};

type ProfileSkill = {
  name: string;
  endorsementStrength?: number;
  experienceLevel?: ExperienceLevel;
  endorsementsCount?: number;
};

type ProfileExperienceItem = {
  id: string;
  companyName: string;
  role: string;
  start: string;
  end?: string;
  description?: string;
  logoUrl?: string;
  technologies?: string[];
};

type ProfileEducationItem = {
  id: string;
  schoolName: string;
  degree: string;
  start: string;
  end?: string;
  logoUrl?: string;
};

type ProfileLanguage = {
  code: string;
  name: string;
  level: LanguageLevel;
};

type ProfileProjectCard = {
  id: string;
  title: string;
  description?: string;
  technologies?: string[];
  url?: string;
  summary?: string;
  screenshots?: string[];
};

type SidebarGigRecommendation = {
  id: string;
  title: string;
  company: string;
  location?: string;
  commitment?: string;
  url: string;
};

type ProfileSidebarData = {
  gigs: SidebarGigRecommendation[];
  featuredLogos: string[];
  qrCodeUrl?: string;
  contactEmail?: string;
  badges?: string[];
};

type ProfileViewModel = {
  summary: ProfileSummary;
  about?: ProfileAboutSection;
  skills: ProfileSkill[];
  experience: ProfileExperienceItem[];
  education: ProfileEducationItem[];
  languages: ProfileLanguage[];
  portfolio: {
    projects: ProfileProjectCard[];
  };
  sidebar: ProfileSidebarData;
};

type ProfileDocuments = {
  profile: Doc<"profiles">;
  user: Doc<"users">;
  education: Array<Doc<"profileEducation">>;
  experience: Array<Doc<"profileWorkExperience">>;
  projects: Array<Doc<"profileProjects">>;
  languages: Array<Doc<"profileLanguages">>;
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  ar: "Arabic",
  es: "Spanish",
  fr: "French",
  de: "German",
  it: "Italian",
  zh: "Chinese",
  ja: "Japanese",
  ru: "Russian",
  pt: "Portuguese",
};

function resolveLanguageName(code: string): string {
  const lowered = code.toLowerCase();
  return LANGUAGE_NAMES[lowered] ?? code.toUpperCase();
}

function isoFromTimestamp(timestamp?: number | null): string | undefined {
  if (!timestamp || Number.isNaN(timestamp)) {
    return undefined;
  }

  try {
    return new Date(timestamp).toISOString();
  } catch (error) {
    console.error("[convex.profile] Failed to convert timestamp:", {
      timestamp,
      error,
    });
    return undefined;
  }
}

function toProfileViewModel(docs: ProfileDocuments): ProfileViewModel {
  const { profile, user, education, experience, projects, languages } = docs;

  const lessonsCompleted = profile.lessonsCompleted
    ? Number(profile.lessonsCompleted)
    : undefined;

  const summary: ProfileSummary = {
    userId: profile.userId,
    slug: profile.slug,
    fullName: user.name,
    headline: profile.headline ?? user.profile?.headline ?? undefined,
    location: {
      city: profile.city ?? user.profile?.location?.city ?? undefined,
      country: profile.country ?? user.profile?.location?.country ?? undefined,
      timezone:
        profile.timezone ?? user.profile?.location?.timezone ?? undefined,
    },
    avatarUrl: profile.avatarUrl ?? user.avatarUrl ?? undefined,
    coverImageUrl: profile.coverImageUrl ?? undefined,
    experienceLevel: profile.experienceLevel,
    stats: {
      completeness: profile.completeness ?? user.profile?.completeness,
      lessonsCompleted,
      lastUpdated: isoFromTimestamp(profile.lastUpdated),
    },
    availability: profile.availability
      ? {
          hoursPerWeek: profile.availability.hoursPerWeek,
          contractType: profile.availability.contractType,
          availableFrom: profile.availability.availableFrom ?? undefined,
        }
      : undefined,
    visibility: profile.visibility,
    social: {
      websiteUrl: user.profile?.portfolio?.websiteUrl ?? undefined,
      githubUrl: user.profile?.portfolio?.githubUrl ?? undefined,
      linkedinUrl: user.profile?.portfolio?.linkedinUrl ?? undefined,
    },
  };

  const about: ProfileAboutSection | undefined = profile.bio
    ? {
        bio: profile.bio,
      }
    : undefined;

  const skills: ProfileSkill[] = (profile.skills ?? []).map((skill) => ({
    name: skill,
  }));

  const experienceItems: ProfileExperienceItem[] = experience
    .map((item) => ({
      id: item._id,
      companyName: item.companyName,
      role: item.role,
      start: item.start,
      end: item.end ?? undefined,
      description: item.description ?? undefined,
      technologies: [],
    }))
    .sort((a, b) => b.start.localeCompare(a.start));

  const educationItems: ProfileEducationItem[] = education
    .map((item) => ({
      id: item._id,
      schoolName: item.schoolName,
      degree: item.degree,
      start: item.start,
      end: item.end ?? undefined,
    }))
    .sort((a, b) => b.start.localeCompare(a.start));

  const languageItems: ProfileLanguage[] = languages.map((language) => ({
    code: language.code,
    name: resolveLanguageName(language.code),
    level: language.level,
  }));

  const projectCards: ProfileProjectCard[] = projects.map((project) => ({
    id: project._id,
    title: project.title,
    description: project.description ?? undefined,
    url: project.url ?? undefined,
    technologies: project.technologies ?? undefined,
    summary: project.description ?? undefined,
    screenshots: [],
  }));

  const badges: string[] = [
    profile.visibility === "public" ? "Public Profile" : null,
    profile.completeness && profile.completeness >= 80
      ? "High Completeness"
      : null,
  ].filter((badge): badge is string => Boolean(badge));

  const sidebar: ProfileSidebarData = {
    gigs: [],
    featuredLogos: [],
    qrCodeUrl: profile.qrCodeUrl ?? undefined,
    contactEmail: profile.contactEmail ?? user.email ?? undefined,
    badges,
  };

  return {
    summary,
    about,
    skills,
    experience: experienceItems,
    education: educationItems,
    languages: languageItems,
    portfolio: {
      projects: projectCards,
    },
    sidebar,
  };
}

async function loadProfileDocuments(
  ctx: QueryCtx,
  profile: Doc<"profiles">,
): Promise<ProfileDocuments> {
  const user = await ctx.db.get(profile.userId);
  if (!user) {
    throw new ConvexError("Profile user record is missing");
  }

  const [education, experience, projects, languages] = await Promise.all([
    ctx.db
      .query("profileEducation")
      .withIndex("by_user", (q) => q.eq("userId", profile.userId))
      .collect(),
    ctx.db
      .query("profileWorkExperience")
      .withIndex("by_user", (q) => q.eq("userId", profile.userId))
      .collect(),
    ctx.db
      .query("profileProjects")
      .withIndex("by_user", (q) => q.eq("userId", profile.userId))
      .collect(),
    ctx.db
      .query("profileLanguages")
      .withIndex("by_user", (q) => q.eq("userId", profile.userId))
      .collect(),
  ]);

  return {
    profile,
    user,
    education,
    experience,
    projects,
    languages,
  };
}

const ProfileCreationArgs = v.object({
  slug: v.optional(v.string()),
  fullName: v.string(),
  headline: v.optional(v.string()),
  bio: v.optional(v.string()),
  experienceLevel: v.union(
    v.literal("beginner"),
    v.literal("intermediate"),
    v.literal("advanced"),
    v.literal("expert"),
  ),
  visibility: v.union(
    v.literal("public"),
    v.literal("platform"),
    v.literal("private"),
  ),
  skills: v.array(v.string()),
  availability: v.optional(
    v.object({
      hoursPerWeek: v.number(),
      contractType: v.union(
        v.literal("freelance"),
        v.literal("part-time"),
        v.literal("full-time"),
      ),
      availableFrom: v.optional(v.string()),
    }),
  ),
  location: v.optional(
    v.object({
      country: v.optional(v.string()),
      city: v.optional(v.string()),
      timezone: v.optional(v.string()),
    }),
  ),
  social: v.optional(
    v.object({
      websiteUrl: v.optional(v.string()),
      githubUrl: v.optional(v.string()),
      linkedinUrl: v.optional(v.string()),
    }),
  ),
  contactEmail: v.optional(v.string()),
});

function calculateInitialCompleteness(
  input: SanitizedProfileCreationInput,
): number {
  let score = 20;

  if (input.headline) {
    score += 10;
  }

  if (input.bio) {
    score += 15;
  }

  if (input.skills.length > 0) {
    score += 20;
  }

  if (input.location && input.location.country && input.location.city) {
    score += 10;
  }

  if (input.availability) {
    score += 10;
  }

  if (input.social && (input.social.websiteUrl || input.social.linkedinUrl)) {
    score += 5;
  }

  if (input.contactEmail) {
    score += 5;
  }

  return Math.min(100, score);
}

async function ensureUniqueSlug(
  ctx: MutationCtx,
  baseSlug: string,
  userId: Id<"users">,
): Promise<string> {
  let candidate = baseSlug;
  let suffix = 1;

  while (true) {
    const existing = await ctx.db
      .query("profiles")
      .withIndex("by_slug", (q) => q.eq("slug", candidate))
      .first();

    if (!existing || existing.userId === userId) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`.slice(0, 60);
    suffix += 1;
  }
}

function buildUserProfilePatch(
  input: SanitizedProfileCreationInput,
  now: number,
  existingProfile: Doc<"users">["profile"],
  completeness: number,
) {
  const location = deriveProfileLocation(input) ?? existingProfile?.location;

  return {
    bio: input.bio,
    headline: input.headline,
    location,
    skills: input.skills,
    experienceLevel: input.experienceLevel,
    education: existingProfile?.education ?? [],
    workExperience: existingProfile?.workExperience ?? [],
    portfolio: existingProfile?.portfolio,
    lessonsCompleted: existingProfile?.lessonsCompleted,
    lastActivityAt: now,
    completeness,
    lastUpdated: now,
    version: (existingProfile?.version ?? 0) + 1,
  } satisfies NonNullable<Doc<"users">["profile"]>;
}

function deriveProfileLocation(input: SanitizedProfileCreationInput):
  | {
      country: string;
      city: string;
      timezone: string;
    }
  | undefined {
  if (!input.location) {
    return undefined;
  }

  const { country, city, timezone } = input.location;

  if (!country || !city || !timezone) {
    return undefined;
  }

  return { country, city, timezone };
}

async function ensureAuthenticatedUser(ctx: MutationCtx): Promise<{
  identity: NonNullable<Awaited<ReturnType<typeof ctx.auth.getUserIdentity>>>;
  user: Doc<"users">;
}> {
  const identity = await ctx.auth.getUserIdentity();
  console.log("identity", identity);
  if (!identity) {
    throw new ConvexError("authentication required to create a profile");
  }

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
    .unique();

  if (!user) {
    throw new ConvexError(
      "User record is missing for the authenticated identity",
    );
  }

  return { identity, user };
}

export const createProfile = mutation({
  args: {
    input: ProfileCreationArgs,
  },
  handler: async (ctx, { input }) => {
    const { identity, user } = await ensureAuthenticatedUser(ctx);

    const validation = ProfileCreationInputSchema.safeParse(input);
    if (!validation.success) {
      throw new ConvexError("Invalid profile submission payload");
    }

    const sanitized = sanitizeProfileCreationInput(validation.data);

    const identityUsername =
      typeof (identity as Record<string, unknown>).username === "string"
        ? ((identity as Record<string, unknown>).username as string)
        : undefined;

    const identitySubject =
      typeof identity.subject === "string"
        ? identity.subject
        : String(identity.subject);

    const slugSeed = sanitized.slugCandidate
      ? sanitized.slugCandidate
      : fallbackSlugCandidates(
          sanitized.fullName,
          identityUsername,
          user.slug ?? undefined,
          identitySubject,
        );

    const slug = await ensureUniqueSlug(ctx, slugSeed, user._id);
    const now = Date.now();
    const completeness = calculateInitialCompleteness(sanitized);

    const profileId = await ctx.db.insert("profiles", {
      userId: user._id,
      slug,
      bio: sanitized.bio,
      headline: sanitized.headline,
      country: sanitized.location?.country,
      city: sanitized.location?.city,
      timezone: sanitized.location?.timezone,
      experienceLevel: sanitized.experienceLevel,
      skills: sanitized.skills,
      lessonsCompleted:
        user.profile?.lessonsCompleted === undefined
          ? undefined
          : typeof user.profile.lessonsCompleted === "bigint"
            ? user.profile.lessonsCompleted
            : BigInt(user.profile.lessonsCompleted),
      lastActivityAt: now,
      completeness,
      availability: sanitized.availability
        ? {
            hoursPerWeek: sanitized.availability.hoursPerWeek,
            contractType: sanitized.availability.contractType,
            availableFrom: sanitized.availability.availableFrom,
          }
        : undefined,
      visibility: sanitized.visibility,
      coverImageUrl: undefined,
      avatarUrl: user.avatarUrl ?? undefined,
      qrCodeUrl: undefined,
      contactEmail: sanitized.contactEmail ?? user.email,
      lastUpdated: now,
      version: 1,
      createdAt: now,
      updatedAt: now,
    });

    const userProfilePatch = buildUserProfilePatch(
      sanitized,
      now,
      user.profile,
      completeness,
    );

    await ctx.db.patch(user._id, {
      slug,
      name: sanitized.fullName,
      profile: userProfilePatch,
      updatedAt: now,
    });

    const createdProfile = await ctx.db.get(profileId);
    if (!createdProfile) {
      throw new ConvexError("Failed to load created profile");
    }

    const docs = await loadProfileDocuments(ctx, createdProfile);
    return toProfileViewModel(docs);
  },
});

export const getProfileBySlug = query({
  args: {
    slug: v.string(),
  },
  handler: async (ctx, args): Promise<ProfileViewModel | null> => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    if (!profile) {
      return null;
    }

    const docs = await loadProfileDocuments(ctx, profile);
    return toProfileViewModel(docs);
  },
});

export const getProfileByUserId = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<ProfileViewModel | null> => {
    const profile = await ctx.db
      .query("profiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (!profile) {
      return null;
    }

    const docs = await loadProfileDocuments(ctx, profile);
    return toProfileViewModel(docs);
  },
});
