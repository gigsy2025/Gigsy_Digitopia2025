import { z } from "zod";

export const EXPERIENCE_LEVELS = [
  "beginner",
  "intermediate",
  "advanced",
  "expert",
] as const;

export const VISIBILITY_LEVELS = ["public", "platform", "private"] as const;

export const CONTRACT_TYPES = ["freelance", "part-time", "full-time"] as const;

export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];
export type Visibility = (typeof VISIBILITY_LEVELS)[number];
export type ContractType = (typeof CONTRACT_TYPES)[number];

const UrlSchema = z
  .string()
  .trim()
  .url()
  .max(512)
  .transform((value) => sanitizeUrl(value))
  .optional();

const LocationSchema = z
  .object({
    country: z.string().trim().min(2).max(100).optional(),
    city: z.string().trim().min(1).max(100).optional(),
    timezone: z
      .string()
      .trim()
      .regex(
        /^[A-Za-z]+\/[A-Za-z0-9_+-]+$/,
        "Timezone must be a valid IANA timezone identifier",
      )
      .optional(),
  })
  .refine(
    (value) =>
      !!value.country ||
      !!value.city ||
      !!value.timezone ||
      Object.keys(value).length === 0,
    {
      message: "At least one location field must be provided",
    },
  )
  .optional();

const AvailabilitySchema = z
  .object({
    hoursPerWeek: z.number().int().min(1).max(80),
    contractType: z.enum(CONTRACT_TYPES),
    availableFrom: z
      .string()
      .trim()
      .refine((value) => {
        if (!value) return true;
        const parsed = Date.parse(value);
        return Number.isFinite(parsed);
      }, "availableFrom must be a valid ISO date string")
      .optional(),
  })
  .optional();

const SocialSchema = z
  .object({
    websiteUrl: UrlSchema,
    githubUrl: UrlSchema,
    linkedinUrl: UrlSchema,
  })
  .optional();

export const ProfileCreationInputSchema = z
  .object({
    slug: z
      .string()
      .trim()
      .min(3)
      .max(60)
      .regex(/^[a-z0-9-]+$/)
      .optional(),
    fullName: z.string().trim().min(2).max(120),
    headline: z.string().trim().min(3).max(120).optional(),
    bio: z
      .string()
      .trim()
      .min(20, "Bio should be at least 20 characters to provide context")
      .max(500)
      .optional(),
    experienceLevel: z.enum(EXPERIENCE_LEVELS).default("intermediate"),
    visibility: z.enum(VISIBILITY_LEVELS).default("platform"),
    skills: z.array(z.string().trim().min(1).max(50)).max(20).default([]),
    availability: AvailabilitySchema,
    location: LocationSchema,
    social: SocialSchema,
    contactEmail: z.string().trim().email().optional(),
  })
  .transform((input) => ({
    ...input,
    skills: Array.from(
      new Set(input.skills.map((skill) => sanitizePlainText(skill, 50))),
    ).filter(Boolean),
  }));

export type ProfileCreationInput = z.infer<typeof ProfileCreationInputSchema>;

export interface SanitizedProfileCreationInput {
  slugCandidate?: string;
  fullName: string;
  headline?: string;
  bio?: string;
  experienceLevel: ExperienceLevel;
  visibility: Visibility;
  skills: string[];
  availability?: {
    hoursPerWeek: number;
    contractType: ContractType;
    availableFrom?: string;
  };
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
  social?: {
    websiteUrl?: string;
    githubUrl?: string;
    linkedinUrl?: string;
  };
  contactEmail?: string;
}

export function sanitizeProfileCreationInput(
  payload: ProfileCreationInput,
): SanitizedProfileCreationInput {
  return {
    slugCandidate: payload.slug ? normalizeSlug(payload.slug) : undefined,
    fullName: sanitizePlainText(payload.fullName, 120),
    headline: payload.headline
      ? sanitizePlainText(payload.headline, 120)
      : undefined,
    bio: payload.bio ? sanitizeRichText(payload.bio, 500) : undefined,
    experienceLevel: payload.experienceLevel,
    visibility: payload.visibility,
    skills: payload.skills.map((skill) => sanitizePlainText(skill, 50)),
    availability: payload.availability
      ? {
          hoursPerWeek: payload.availability.hoursPerWeek,
          contractType: payload.availability.contractType,
          availableFrom: payload.availability.availableFrom
            ? new Date(payload.availability.availableFrom).toISOString()
            : undefined,
        }
      : undefined,
    location: payload.location
      ? {
          country: payload.location.country
            ? sanitizePlainText(payload.location.country, 100)
            : undefined,
          city: payload.location.city
            ? sanitizePlainText(payload.location.city, 100)
            : undefined,
          timezone: payload.location.timezone
            ? payload.location.timezone.trim()
            : undefined,
        }
      : undefined,
    social: payload.social
      ? {
          websiteUrl: payload.social.websiteUrl,
          githubUrl: payload.social.githubUrl,
          linkedinUrl: payload.social.linkedinUrl,
        }
      : undefined,
    contactEmail: payload.contactEmail?.toLowerCase(),
  };
}

export function normalizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function fallbackSlugCandidates(
  ...inputs: Array<string | undefined>
): string {
  for (const value of inputs) {
    if (!value) continue;
    const candidate = normalizeSlug(value);
    if (candidate.length >= 3) {
      return candidate;
    }
  }
  return `member-${Math.random().toString(36).slice(2, 8)}`;
}

function sanitizePlainText(value: string, maxLength: number): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function sanitizeRichText(value: string, maxLength: number): string {
  return sanitizePlainText(value, maxLength);
}

function sanitizeUrl(value: string): string {
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Unsupported protocol");
    }
    url.hash = ""; // strip fragments
    return url.toString();
  } catch {
    return value;
  }
}
