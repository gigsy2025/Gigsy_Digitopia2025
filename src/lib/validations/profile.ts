/**
 * Profile Validation Schemas
 *
 * Zod schemas for validating profile data at runtime, ensuring data integrity
 * and providing user-friendly error messages for form validation.
 */

import { z } from "zod";

/**
 * Profile validation constants
 */
const PROFILE_VALIDATION = {
  MAX_BIO_LENGTH: 500,
  MAX_HEADLINE_LENGTH: 100,
  MAX_SKILLS_COUNT: 20,
  MAX_EDUCATION_COUNT: 10,
  MAX_WORK_EXPERIENCE_COUNT: 15,
  MAX_PORTFOLIO_PROJECTS: 10,
} as const;

/**
 * Experience level validation schema
 */
export const ExperienceLevelSchema = z.enum(
  ["beginner", "intermediate", "advanced", "expert"],
  {
    errorMap: () => ({
      message:
        "Experience level must be one of: beginner, intermediate, advanced, expert",
    }),
  },
);

/**
 * Location validation schema
 */
export const LocationSchema = z.object({
  country: z
    .string()
    .min(2, "Country must be at least 2 characters")
    .max(100, "Country name is too long"),
  city: z
    .string()
    .min(1, "City name is required")
    .max(100, "City name is too long"),
  timezone: z
    .string()
    .min(1, "Timezone is required")
    .regex(
      /^[A-Z][a-z_]+\/[A-Z][a-z_]+$/,
      "Timezone must be a valid IANA timezone (e.g., 'Africa/Cairo')",
    ),
});

/**
 * Education entry validation schema
 */
export const EducationSchema = z.object({
  school: z
    .string()
    .min(2, "School name must be at least 2 characters")
    .max(200, "School name is too long"),
  degree: z
    .string()
    .min(2, "Degree must be at least 2 characters")
    .max(200, "Degree description is too long"),
  start: z
    .string()
    .regex(
      /^\d{4}(-\d{2})?(-\d{2})?$/,
      "Start date must be in YYYY, YYYY-MM, or YYYY-MM-DD format",
    ),
  end: z
    .string()
    .regex(
      /^\d{4}(-\d{2})?(-\d{2})?$/,
      "End date must be in YYYY, YYYY-MM, or YYYY-MM-DD format",
    )
    .optional(),
});

/**
 * Work experience entry validation schema
 */
export const WorkExperienceSchema = z.object({
  company: z
    .string()
    .min(1, "Company name is required")
    .max(200, "Company name is too long"),
  role: z
    .string()
    .min(1, "Role/position is required")
    .max(200, "Role description is too long"),
  start: z
    .string()
    .regex(
      /^\d{4}(-\d{2})?(-\d{2})?$/,
      "Start date must be in YYYY, YYYY-MM, or YYYY-MM-DD format",
    ),
  end: z
    .string()
    .regex(
      /^\d{4}(-\d{2})?(-\d{2})?$/,
      "End date must be in YYYY, YYYY-MM, or YYYY-MM-DD format",
    )
    .optional(),
  description: z
    .string()
    .max(1000, "Description must be under 1000 characters")
    .optional(),
});

/**
 * Portfolio project validation schema
 */
export const PortfolioProjectSchema = z.object({
  title: z
    .string()
    .min(1, "Project title is required")
    .max(100, "Project title is too long"),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  description: z
    .string()
    .max(500, "Project description must be under 500 characters")
    .optional(),
  technologies: z
    .array(z.string().min(1).max(50))
    .max(20, "Maximum 20 technologies per project")
    .optional(),
});

/**
 * Portfolio validation schema
 */
export const PortfolioSchema = z.object({
  projects: z
    .array(PortfolioProjectSchema)
    .max(
      PROFILE_VALIDATION.MAX_PORTFOLIO_PROJECTS,
      `Maximum ${PROFILE_VALIDATION.MAX_PORTFOLIO_PROJECTS} portfolio projects allowed`,
    ),
  websiteUrl: z
    .string()
    .url("Must be a valid website URL")
    .optional()
    .or(z.literal("")),
  githubUrl: z
    .string()
    .url("Must be a valid GitHub URL")
    .optional()
    .or(z.literal("")),
  linkedinUrl: z
    .string()
    .url("Must be a valid LinkedIn URL")
    .optional()
    .or(z.literal("")),
});

/**
 * Complete user profile validation schema
 */
export const UserProfileSchema = z.object({
  bio: z
    .string()
    .max(
      PROFILE_VALIDATION.MAX_BIO_LENGTH,
      `Bio must be under ${PROFILE_VALIDATION.MAX_BIO_LENGTH} characters`,
    )
    .optional(),
  headline: z
    .string()
    .max(
      PROFILE_VALIDATION.MAX_HEADLINE_LENGTH,
      `Headline must be under ${PROFILE_VALIDATION.MAX_HEADLINE_LENGTH} characters`,
    )
    .optional(),
  location: LocationSchema.optional(),
  skills: z
    .array(
      z
        .string()
        .min(1, "Skill name cannot be empty")
        .max(50, "Skill name too long"),
    )
    .min(1, "At least one skill is required")
    .max(
      PROFILE_VALIDATION.MAX_SKILLS_COUNT,
      `Maximum ${PROFILE_VALIDATION.MAX_SKILLS_COUNT} skills allowed`,
    ),
  experienceLevel: ExperienceLevelSchema,
  education: z
    .array(EducationSchema)
    .max(
      PROFILE_VALIDATION.MAX_EDUCATION_COUNT,
      `Maximum ${PROFILE_VALIDATION.MAX_EDUCATION_COUNT} education entries allowed`,
    ),
  workExperience: z
    .array(WorkExperienceSchema)
    .max(
      PROFILE_VALIDATION.MAX_WORK_EXPERIENCE_COUNT,
      `Maximum ${PROFILE_VALIDATION.MAX_WORK_EXPERIENCE_COUNT} work experience entries allowed`,
    ),
  portfolio: PortfolioSchema.optional(),
});

/**
 * Profile update schema (all fields optional)
 */
export const UserProfileUpdateSchema = UserProfileSchema.partial();

/**
 * Profile search filters validation schema
 */
export const ProfileSearchFiltersSchema = z.object({
  skills: z.array(z.string()).optional(),
  experienceLevel: z
    .union([ExperienceLevelSchema, z.array(ExperienceLevelSchema)])
    .optional(),
  location: z
    .object({
      country: z.string().optional(),
      city: z.string().optional(),
    })
    .optional(),
  education: z
    .object({
      degree: z.string().optional(),
      school: z.string().optional(),
    })
    .optional(),
});

/**
 * Helper function to validate a profile and return user-friendly errors
 */
export const validateProfile = (profile: unknown) => {
  const result = UserProfileSchema.safeParse(profile);

  if (!result.success) {
    const errors: Record<string, string> = {};

    result.error.issues.forEach((issue) => {
      const path = issue.path.join(".");
      errors[path] = issue.message;
    });

    return { success: false, errors };
  }

  return { success: true, data: result.data };
};

/**
 * Helper function to calculate profile completeness
 */
export const calculateProfileCompleteness = (profile: unknown) => {
  // Type guard to safely access profile properties
  const safeProfile = profile as Record<string, unknown> | null | undefined;

  if (!safeProfile) {
    return {
      basicInfo: false,
      location: false,
      skills: false,
      education: false,
      workExperience: false,
      portfolio: false,
      completionPercentage: 0,
    };
  }

  const checks = {
    basicInfo: Boolean(safeProfile.bio ?? safeProfile.headline),
    location: Boolean(safeProfile.location),
    skills: Boolean(
      Array.isArray(safeProfile.skills) && safeProfile.skills.length > 0,
    ),
    education: Boolean(
      Array.isArray(safeProfile.education) && safeProfile.education.length > 0,
    ),
    workExperience: Boolean(
      Array.isArray(safeProfile.workExperience) &&
        safeProfile.workExperience.length > 0,
    ),
    portfolio: Boolean(
      safeProfile.portfolio &&
        typeof safeProfile.portfolio === "object" &&
        safeProfile.portfolio !== null &&
        (() => {
          const portfolio = safeProfile.portfolio as Record<string, unknown>;
          return (
            (Array.isArray(portfolio.projects) &&
              portfolio.projects.length > 0) ??
            Boolean(portfolio.websiteUrl) ??
            Boolean(portfolio.githubUrl) ??
            Boolean(portfolio.linkedinUrl)
          );
        })(),
    ),
  };

  const completedSections = Object.values(checks).filter(Boolean).length;
  const totalSections = Object.keys(checks).length;
  const completionPercentage = Math.round(
    (completedSections / totalSections) * 100,
  );

  return {
    ...checks,
    completionPercentage,
  };
};
