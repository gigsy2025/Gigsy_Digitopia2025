/**
 * Step Validation Utility for Course Creation Form
 *
 * This utility provides centralized, type-safe validation for each step
 * of the course creation process. It decouples validation logic from UI
 * components, ensuring that step completion is based on data validity
 * rather than user interaction alone.
 *
 * PRINCIPLES:
 * - Single Responsibility: Encapsulates all step-specific validation logic.
 * - Type-Safe: Uses Zod schemas and TypeScript types for robust validation.
 * - Scalable: Easily extendable for new steps or validation rules.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-17
 */

import { z } from "zod";
import type { CourseFormData, FormStep } from "../../types/course";

// =============================================================================
// ZOD SCHEMAS FOR STEP VALIDATION
// =============================================================================

const BasicInfoSchema = z.object({
  title: z.string().min(1, "Title is required."),
  description: z.string().min(1, "Description is required."),
  difficultyLevel: z.enum(["beginner", "intermediate", "advanced"]),
});

const MediaAssetsSchema = z.object({
  thumbnailId: z.string().min(1, "Thumbnail is required."),
});

const CourseStructureSchema = z.object({
  modules: z
    .array(
      z.object({
        title: z.string().min(1),
        lessons: z
          .array(
            z.object({
              title: z.string().min(1),
              content: z.string().min(1),
            }),
          )
          .min(1, "Each module must have at least one lesson."),
      }),
    )
    .min(1, "Course must have at least one module."),
});

const PricingSchema = z
  .object({
    pricingType: z.enum(["free", "one-time", "subscription"]),
    price: z.number().optional(),
  })
  .refine(
    (data) => {
      if (data.pricingType !== "free") {
        return data.price !== undefined && data.price > 0;
      }
      return true;
    },
    {
      message: "Price must be greater than 0 for paid courses.",
      path: ["price"],
    },
  );

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

/**
 * Validates the data for a specific step in the course creation form.
 *
 * @param formData - The current state of the form data.
 * @param step - The form step to validate.
 * @returns True if the step's data is valid, false otherwise.
 */
export function validateStep(
  formData: Partial<CourseFormData>,
  step: FormStep,
): boolean {
  switch (step) {
    case "basic":
      return BasicInfoSchema.safeParse(formData).success;
    case "media":
      return MediaAssetsSchema.safeParse(formData).success;
    case "structure":
      return CourseStructureSchema.safeParse(formData).success;
    case "pricing":
      return PricingSchema.safeParse(formData).success;
    default:
      return false;
  }
}

/**
 * Validates all steps of the course creation form.
 *
 * @param formData - The complete form data.
 * @returns True if all steps are valid, false otherwise.
 */
export function validateAll(formData: CourseFormData): boolean {
  const steps: FormStep[] = ["basic", "media", "structure", "pricing"];
  return steps.every((step) => validateStep(formData, step));
}
