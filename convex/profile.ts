import { query, mutation } from "./_generated/server";
import type { QueryCtx, MutationCtx } from "./_generated/server";
import { v, ConvexError } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import {
  ProfileCreationInputSchema,
  ProfileUpdateInputSchema,
  sanitizeProfileCreationInput,
  sanitizeProfileUpdateInput,
  fallbackSlugCandidates,
  type SanitizedProfileCreationInput,
} from "../shared/profile/profileCreationSchema";

type ExperienceLevel = "beginner" | "intermediate" | "advanced" | "expert";
type ContractType = "freelance" | "part-time" | "full-time";
type Visibility = "public" | "platform" | "private";
type LanguageLevel = "basic" | "conversational" | "fluent" | "native";

type ProfileSummary = {
  userId: Id<"users">;
  profileRecordId: Id<"profiles">;
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
  viewerCanEdit?: boolean;
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
    profileRecordId: profile._id,
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
    viewerCanEdit: false,
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

const ProfileUpdateArgs = v.object({
  profileId: v.id("profiles"),
  headline: v.optional(v.union(v.string(), v.null())),
  bio: v.optional(v.union(v.string(), v.null())),
  experienceLevel: v.optional(
    v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced"),
      v.literal("expert"),
    ),
  ),
  visibility: v.optional(
    v.union(v.literal("public"), v.literal("platform"), v.literal("private")),
  ),
  skills: v.optional(v.union(v.array(v.string()), v.null())),
  availability: v.optional(
    v.union(
      v.null(),
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
  ),
  location: v.optional(
    v.union(
      v.null(),
      v.object({
        country: v.optional(v.string()),
        city: v.optional(v.string()),
        timezone: v.optional(v.string()),
      }),
    ),
  ),
  contactEmail: v.optional(v.union(v.string(), v.null())),
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

function resolveUserFullName(user: Doc<"users">, profile: Doc<"profiles">) {
  if (user.name?.trim()) {
    return user.name.trim();
  }

  if (profile.slug?.trim()) {
    return profile.slug.trim();
  }

  return `member-${user._id}`;
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

function buildUpdatePatch(
  sanitized:
    | ReturnType<typeof sanitizeProfileUpdateInput>
    | SanitizedProfileCreationInput,
): Partial<Doc<"profiles">> {
  const patch: Partial<Doc<"profiles">> = {};

  if (hasOwnProperty(sanitized, "headline")) {
    patch.headline = sanitized.headline ?? undefined;
  }

  if (hasOwnProperty(sanitized, "bio")) {
    patch.bio = sanitized.bio ?? undefined;
  }

  if (sanitized.experienceLevel !== undefined) {
    patch.experienceLevel = sanitized.experienceLevel;
  }

  if (hasOwnProperty(sanitized, "skills")) {
    patch.skills = sanitized.skills ?? [];
  }

  if (hasOwnProperty(sanitized, "visibility") && sanitized.visibility) {
    patch.visibility = sanitized.visibility;
  }

  if (hasOwnProperty(sanitized, "availability")) {
    patch.availability = sanitized.availability
      ? {
          hoursPerWeek: sanitized.availability.hoursPerWeek,
          contractType: sanitized.availability.contractType,
          availableFrom: sanitized.availability.availableFrom,
        }
      : undefined;
  }

  if (hasOwnProperty(sanitized, "location")) {
    patch.country = sanitized.location?.country ?? undefined;
    patch.city = sanitized.location?.city ?? undefined;
    patch.timezone = sanitized.location?.timezone ?? undefined;
  }

  if (hasOwnProperty(sanitized, "contactEmail")) {
    patch.contactEmail = sanitized.contactEmail ?? undefined;
  }

  return patch;
}

function hasOwnProperty<T extends object, K extends PropertyKey>(
  object: T,
  key: K,
): key is K & keyof T {
  return Object.prototype.hasOwnProperty.call(object, key);
}

export const updateProfile = mutation({
  args: ProfileUpdateArgs,
  handler: async (ctx, args) => {
    const { user } = await ensureAuthenticatedUser(ctx);

    const profile = await ctx.db.get(args.profileId);
    if (!profile) {
      throw new ConvexError("Profile not found");
    }

    if (profile.userId !== user._id) {
      throw new ConvexError("Unauthorized profile update");
    }

    const validation = ProfileUpdateInputSchema.safeParse({
      headline: args.headline,
      bio: args.bio,
      experienceLevel: args.experienceLevel,
      visibility: args.visibility,
      skills: args.skills,
      availability: args.availability,
      location: args.location,
      contactEmail: args.contactEmail,
    });

    if (!validation.success) {
      throw new ConvexError("Invalid profile update payload");
    }

    const sanitized = sanitizeProfileUpdateInput(validation.data);
    const patch = buildUpdatePatch(sanitized);

    if (Object.keys(patch).length === 0) {
      return await loadProfileDocuments(ctx, profile).then(toProfileViewModel);
    }

    const now = Date.now();
    const patchWithMeta: Partial<Doc<"profiles">> = {
      ...patch,
      updatedAt: now,
      lastUpdated: now,
      lastActivityAt: now,
      version: (profile.version ?? 1) + 1,
    };

    await ctx.db.patch(args.profileId, patchWithMeta);

    const updatedProfile = await ctx.db.get(args.profileId);
    if (!updatedProfile) {
      throw new ConvexError("Profile update failed");
    }

    const existingUser = await ctx.db.get(user._id);
    if (!existingUser) {
      throw new ConvexError("User record missing after profile update");
    }

    const resolvedFullName = resolveUserFullName(existingUser, updatedProfile);

    const resolvedExperienceLevel =
      updatedProfile.experienceLevel ?? profile.experienceLevel;

    const resolvedVisibility = updatedProfile.visibility ?? profile.visibility;

    const updatedSanitizedInput: SanitizedProfileCreationInput = {
      fullName: resolvedFullName,
      headline: updatedProfile.headline ?? undefined,
      bio: updatedProfile.bio ?? undefined,
      experienceLevel: resolvedExperienceLevel,
      visibility: resolvedVisibility,
      skills: updatedProfile.skills ?? profile.skills ?? [],
      availability: updatedProfile.availability
        ? {
            hoursPerWeek: updatedProfile.availability.hoursPerWeek,
            contractType: updatedProfile.availability.contractType,
            availableFrom:
              updatedProfile.availability.availableFrom ?? undefined,
          }
        : undefined,
      location:
        updatedProfile.country || updatedProfile.city || updatedProfile.timezone
          ? {
              country: updatedProfile.country ?? undefined,
              city: updatedProfile.city ?? undefined,
              timezone: updatedProfile.timezone ?? undefined,
            }
          : undefined,
      social: undefined,
      contactEmail:
        updatedProfile.contactEmail ?? existingUser.email ?? undefined,
    };

    const completeness = calculateInitialCompleteness(updatedSanitizedInput);

    const userProfilePatch = buildUserProfilePatch(
      updatedSanitizedInput,
      now,
      existingUser.profile,
      completeness,
    );

    await ctx.db.patch(user._id, {
      name: resolvedFullName,
      profile: userProfilePatch,
      updatedAt: now,
    });

    const docs = await loadProfileDocuments(ctx, updatedProfile);
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
