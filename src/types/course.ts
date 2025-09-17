/**
 * Type definitions for Course Management
 *
 * This file contains all TypeScript interfaces and types related to
 * course structure, form data, and step management. Centralizing these
 * types ensures consistency across the application, from form handling
 * to validation and API communication.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-09-17
 */

export interface CourseFormData {
  title: string;
  description: string;
  shortDescription?: string;
  difficultyLevel: "beginner" | "intermediate" | "advanced";
  pricingType: "free" | "one-time" | "subscription";
  price?: number;
  estimatedDuration?: number;
  tags: string[];
  skills: string[];
  thumbnailId?: string;
  bannerId?: string;
  introVideoId?: string;
  isPublic?: boolean;
  modules: ModuleFormData[];
}

export interface ModuleFormData {
  title: string;
  description?: string;
  thumbnailId?: string;
  estimatedDuration?: number;
  isRequired?: boolean;
  lessons: LessonFormData[];
  isExpanded?: boolean;
}

export interface LessonFormData {
  title: string;
  description?: string;
  contentType: "text" | "video" | "file";
  content: string;
  thumbnailId?: string;
  estimatedDuration?: number;
  isRequired?: boolean;
  isExpanded?: boolean;
}

export type FormStep = "basic" | "media" | "structure" | "pricing" | "review";

export interface FormProgress {
  currentStep: FormStep;
  completedSteps: FormStep[];
  isSubmitting: boolean;
  isDraft: boolean;
  lastSaved?: Date;
}
