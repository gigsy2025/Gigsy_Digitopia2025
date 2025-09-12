/**
 * Zod validation schemas for gigs
 * Provides runtime validation with user-friendly error messages
 */

import { z } from "zod";

// Status validation schema
export const GigStatusSchema = z.enum(
  [
    "draft",
    "open",
    "in_progress",
    "in_review",
    "completed",
    "cancelled",
    "paused",
  ],
  {
    errorMap: () => ({
      message:
        "Status must be one of: draft, open, in_progress, in_review, completed, cancelled, paused",
    }),
  },
);

// Category validation schema
export const GigCategorySchema = z.enum(
  [
    "design",
    "development",
    "writing",
    "marketing",
    "data",
    "video",
    "audio",
    "business",
    "other",
  ],
  {
    errorMap: () => ({
      message: "Please select a valid category",
    }),
  },
);

// Difficulty level validation
export const DifficultyLevelSchema = z.enum(
  ["beginner", "intermediate", "advanced", "expert"],
  {
    errorMap: () => ({
      message: "Difficulty must be beginner, intermediate, advanced, or expert",
    }),
  },
);

// Experience level validation
export const ExperienceLevelSchema = z.enum(
  ["entry", "intermediate", "senior", "expert"],
  {
    errorMap: () => ({
      message:
        "Experience level must be entry, intermediate, senior, or expert",
    }),
  },
);

// Currency validation
export const CurrencySchema = z.enum(["EGP", "USD", "EUR"], {
  errorMap: () => ({
    message: "Currency must be EGP, USD, or EUR",
  }),
});

// Budget type validation
export const BudgetTypeSchema = z.enum(["fixed", "hourly", "milestone"], {
  errorMap: () => ({
    message: "Budget type must be fixed, hourly, or milestone",
  }),
});

// Duration unit validation
export const DurationUnitSchema = z.enum(["hours", "days", "weeks", "months"]);

// Location type validation
export const LocationTypeSchema = z.enum(["remote", "onsite", "hybrid"]);

// Budget validation schema
export const GigBudgetSchema = z
  .object({
    min: z
      .number()
      .positive("Minimum budget must be positive")
      .min(25, "Minimum budget must be at least $25"),
    max: z.number().positive("Maximum budget must be positive"),
    currency: CurrencySchema,
    type: BudgetTypeSchema,
  })
  .refine((data) => data.max >= data.min, {
    message: "Maximum budget must be greater than or equal to minimum budget",
    path: ["max"],
  });

// Estimated duration schema
export const EstimatedDurationSchema = z.object({
  value: z
    .number()
    .positive("Duration value must be positive")
    .max(365, "Duration cannot exceed 365 units"),
  unit: DurationUnitSchema,
});

// Location schema
export const GigLocationSchema = z
  .object({
    type: LocationTypeSchema,
    city: z.string().min(2, "City must be at least 2 characters").optional(),
    country: z
      .string()
      .min(2, "Country must be at least 2 characters")
      .optional(),
    timezone: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "onsite" || data.type === "hybrid") {
        return data.city && data.country;
      }
      return true;
    },
    {
      message: "City and country are required for onsite and hybrid gigs",
      path: ["city"],
    },
  );

// Gig metadata schema
export const GigMetadataSchema = z.object({
  views: z.number().min(0).default(0),
  applicantCount: z.number().min(0).default(0),
  savedCount: z.number().min(0).default(0),
  featuredUntil: z.number().optional(),
  publishedAt: z.number().optional(),
  lastModified: z.number(),
  version: z.number().min(1).default(1),
  isUrgent: z.boolean().default(false),
  isRemoteOnly: z.boolean().default(false),
});

// Core gig creation schema
export const CreateGigSchema = z
  .object({
    title: z
      .string()
      .min(10, "Title must be at least 10 characters")
      .max(100, "Title must be under 100 characters")
      .trim(),

    description: z
      .string()
      .min(50, "Description must be at least 50 characters")
      .max(5000, "Description must be under 5000 characters")
      .trim(),

    skills: z
      .array(z.string().min(1, "Skill cannot be empty"))
      .min(1, "At least one skill is required")
      .max(15, "Maximum 15 skills allowed")
      .refine((skills) => new Set(skills).size === skills.length, {
        message: "Skills must be unique",
      }),

    category: GigCategorySchema,
    difficultyLevel: DifficultyLevelSchema,
    experienceRequired: ExperienceLevelSchema,
    budget: GigBudgetSchema,

    deadline: z
      .number()
      .optional()
      .refine((date) => !date || date > Date.now(), {
        message: "Deadline must be in the future",
      }),

    estimatedDuration: EstimatedDurationSchema.optional(),

    applicationDeadline: z
      .number()
      .optional()
      .refine((date) => !date || date > Date.now(), {
        message: "Application deadline must be in the future",
      }),

    location: GigLocationSchema.optional(),
    metadata: GigMetadataSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.applicationDeadline && data.deadline) {
        return data.applicationDeadline < data.deadline;
      }
      return true;
    },
    {
      message: "Application deadline must be before project deadline",
      path: ["applicationDeadline"],
    },
  );

// Gig update schema (partial updates allowed)
export const UpdateGigSchema = z.object({
  title: z
    .string()
    .min(10, "Title must be at least 10 characters")
    .max(100, "Title must be under 100 characters")
    .trim()
    .optional(),

  description: z
    .string()
    .min(50, "Description must be at least 50 characters")
    .max(5000, "Description must be under 5000 characters")
    .trim()
    .optional(),

  skills: z
    .array(z.string().min(1, "Skill cannot be empty"))
    .min(1, "At least one skill is required")
    .max(15, "Maximum 15 skills allowed")
    .refine((skills) => new Set(skills).size === skills.length, {
      message: "Skills must be unique",
    })
    .optional(),

  category: GigCategorySchema.optional(),
  difficultyLevel: DifficultyLevelSchema.optional(),
  experienceRequired: ExperienceLevelSchema.optional(),
  budget: GigBudgetSchema.optional(),
  status: GigStatusSchema.optional(),

  deadline: z
    .number()
    .optional()
    .refine((date) => !date || date > Date.now(), {
      message: "Deadline must be in the future",
    })
    .optional(),

  estimatedDuration: EstimatedDurationSchema.optional(),

  applicationDeadline: z
    .number()
    .optional()
    .refine((date) => !date || date > Date.now(), {
      message: "Application deadline must be in the future",
    })
    .optional(),

  location: GigLocationSchema.optional(),
  metadata: GigMetadataSchema.optional(),
});

// Gig search/filter schema
export const GigFiltersSchema = z
  .object({
    status: z.union([GigStatusSchema, z.array(GigStatusSchema)]).optional(),
    category: z
      .union([GigCategorySchema, z.array(GigCategorySchema)])
      .optional(),
    experienceRequired: z
      .union([ExperienceLevelSchema, z.array(ExperienceLevelSchema)])
      .optional(),
    difficultyLevel: z
      .union([DifficultyLevelSchema, z.array(DifficultyLevelSchema)])
      .optional(),
    budgetMin: z.number().positive().optional(),
    budgetMax: z.number().positive().optional(),
    currency: CurrencySchema.optional(),
    budgetType: BudgetTypeSchema.optional(),
    locationType: LocationTypeSchema.optional(),
    isRemoteOnly: z.boolean().optional(),
    isUrgent: z.boolean().optional(),
    skills: z.array(z.string()).optional(),
    employerId: z.string().optional(),
    deadlineAfter: z.number().optional(),
    deadlineBefore: z.number().optional(),
    isFeatured: z.boolean().optional(),
  })
  .refine(
    (data) => {
      if (data.budgetMin && data.budgetMax) {
        return data.budgetMax >= data.budgetMin;
      }
      return true;
    },
    {
      message: "Maximum budget must be greater than or equal to minimum budget",
      path: ["budgetMax"],
    },
  );

// Status transition validation
export const GigStatusTransitionSchema = z.object({
  from: GigStatusSchema,
  to: GigStatusSchema,
  gigId: z.string(),
  userId: z.string(),
  reason: z.string().optional(),
});

// Utility validation functions
export const validateGigData = (data: unknown) => {
  return CreateGigSchema.safeParse(data);
};

export const validateGigUpdate = (data: unknown) => {
  return UpdateGigSchema.safeParse(data);
};

export const validateGigFilters = (data: unknown) => {
  return GigFiltersSchema.safeParse(data);
};

// Error formatting helper
export const formatGigValidationErrors = (errors: z.ZodError) => {
  const formattedErrors: Record<string, string> = {};

  errors.issues.forEach((issue) => {
    const path = issue.path.join(".");
    formattedErrors[path] = issue.message;
  });

  return formattedErrors;
};

// Export types inferred from schemas
export type CreateGigInput = z.infer<typeof CreateGigSchema>;
export type UpdateGigInput = z.infer<typeof UpdateGigSchema>;
export type GigFiltersInput = z.infer<typeof GigFiltersSchema>;
export type GigStatusTransitionInput = z.infer<
  typeof GigStatusTransitionSchema
>;
