import { z } from "zod";

import {
  BudgetTypeSchema,
  CurrencySchema,
  DurationUnitSchema,
  ExperienceLevelSchema,
  DifficultyLevelSchema,
  GigCategorySchema,
  LocationTypeSchema,
} from "@/lib/validations/gigs";

export const GIG_EDITOR_CATEGORY_OPTIONS = GigCategorySchema.options;
export const GIG_EDITOR_EXPERIENCE_LEVELS = ExperienceLevelSchema.options;
export const GIG_EDITOR_DIFFICULTY_LEVELS = DifficultyLevelSchema.options;
export const GIG_EDITOR_BUDGET_TYPES = BudgetTypeSchema.options;
export const GIG_EDITOR_CURRENCIES = CurrencySchema.options;
export const GIG_EDITOR_LOCATION_TYPES = LocationTypeSchema.options;
export const GIG_EDITOR_DURATION_UNITS = DurationUnitSchema.options;

export const GigEditorSchema = z
  .object({
    title: z.string().min(10).max(100).trim(),
    description: z.string().min(50).max(5000).trim(),
    category: z.enum(GIG_EDITOR_CATEGORY_OPTIONS),
    experienceRequired: z.enum(GIG_EDITOR_EXPERIENCE_LEVELS),
    difficultyLevel: z.enum(GIG_EDITOR_DIFFICULTY_LEVELS),
    skills: z
      .array(z.string().min(1).max(40))
      .min(1, "Add at least one skill")
      .max(15, "Maximum 15 skills"),
    budgetMin: z.coerce.number().min(0),
    budgetMax: z.coerce.number().min(0),
    budgetCurrency: z.enum(GIG_EDITOR_CURRENCIES),
    budgetType: z.enum(GIG_EDITOR_BUDGET_TYPES),
    applicationDeadline: z.string().optional(),
    projectDeadline: z.string().optional(),
    locationType: z.enum(GIG_EDITOR_LOCATION_TYPES),
    locationCity: z.string().max(120).optional(),
    locationCountry: z.string().max(120).optional(),
    isRemoteOnly: z.boolean(),
    isUrgent: z.boolean(),
    estimatedDurationValue: z.coerce.number().min(1).max(365).optional(),
    estimatedDurationUnit: z.enum(GIG_EDITOR_DURATION_UNITS).optional(),
  })
  .refine((value) => value.budgetMax >= value.budgetMin, {
    path: ["budgetMax"],
    message: "Maximum budget must be greater than or equal to minimum budget",
  })
  .refine(
    (value) => {
      if (value.locationType === "onsite" || value.locationType === "hybrid") {
        return (
          Boolean(value.locationCity?.trim()) &&
          Boolean(value.locationCountry?.trim())
        );
      }
      return true;
    },
    {
      path: ["locationCity"],
      message: "City and country are required for onsite or hybrid gigs",
    },
  )
  .refine(
    (value) => {
      if (value.estimatedDurationValue) {
        return Boolean(value.estimatedDurationUnit);
      }
      return true;
    },
    {
      path: ["estimatedDurationUnit"],
      message: "Select a duration unit",
    },
  );

export type GigEditorFormValues = z.infer<typeof GigEditorSchema>;

export type GigEditorPayload = {
  title: string;
  description: string;
  category: (typeof GIG_EDITOR_CATEGORY_OPTIONS)[number];
  experienceRequired: (typeof GIG_EDITOR_EXPERIENCE_LEVELS)[number];
  difficultyLevel: (typeof GIG_EDITOR_DIFFICULTY_LEVELS)[number];
  skills: string[];
  budget: {
    min: number;
    max: number;
    currency: (typeof GIG_EDITOR_CURRENCIES)[number];
    type: (typeof GIG_EDITOR_BUDGET_TYPES)[number];
  };
  applicationDeadline: number | null;
  deadline: number | null;
  estimatedDuration: {
    value: number;
    unit: (typeof GIG_EDITOR_DURATION_UNITS)[number];
  } | null;
  location: {
    type: (typeof GIG_EDITOR_LOCATION_TYPES)[number];
    city?: string;
    country?: string;
  };
  metadata: {
    isRemoteOnly: boolean;
    isUrgent: boolean;
  };
  expectedVersion?: number;
};
