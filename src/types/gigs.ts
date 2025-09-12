/**
 * TypeScript type definitions for gigs schema
 * This file provides type safety for gig-related operations
 */

import type { Doc, Id } from "../../convex/_generated/dataModel";

// Export the core Gig type from Convex
export type Gig = Doc<"gigs">;

// Gig status literal types
export type GigStatus =
  | "draft" // Gig is being created/edited
  | "open" // Gig is published and accepting applications
  | "in_progress" // Work has started
  | "in_review" // Work submitted, under review
  | "completed" // Gig successfully finished
  | "cancelled" // Gig was cancelled
  | "paused"; // Gig temporarily paused

// Gig categories
export type GigCategory =
  | "design" // Graphic design, UI/UX, branding
  | "development" // Web, mobile, software development
  | "writing" // Content writing, copywriting, technical writing
  | "marketing" // Digital marketing, SEO, social media
  | "data" // Data analysis, machine learning, research
  | "video" // Video editing, animation, production
  | "audio" // Audio editing, music production, voice-over
  | "business" // Consulting, strategy, project management
  | "other"; // Miscellaneous categories

// Difficulty levels
export type DifficultyLevel =
  | "beginner" // Entry-level, simple tasks
  | "intermediate" // Moderate complexity
  | "advanced" // High complexity, specialized skills
  | "expert"; // Cutting-edge, industry expert level

// Experience levels required
export type ExperienceLevel =
  | "entry" // 0-2 years experience
  | "intermediate" // 2-5 years experience
  | "senior" // 5+ years experience
  | "expert"; // 10+ years, domain expert

// Budget types
export type BudgetType =
  | "fixed" // One-time fixed payment
  | "hourly" // Hourly rate
  | "milestone"; // Payment by milestones

// Supported currencies
export type Currency = "EGP" | "USD" | "EUR";

// Time duration units
export type DurationUnit = "hours" | "days" | "weeks" | "months";

// Location work types
export type LocationType = "remote" | "onsite" | "hybrid";

// Budget structure interface
export interface GigBudget {
  min: number;
  max: number;
  currency: Currency;
  type: BudgetType;
}

// Estimated duration interface
export interface EstimatedDuration {
  value: number;
  unit: DurationUnit;
}

// Location interface
export interface GigLocation {
  type: LocationType;
  city?: string;
  country?: string;
  timezone?: string; // For remote work coordination
}

// Gig metadata for analytics and features
export interface GigMetadata {
  views: number; // Page views count
  applicantCount: number; // Number of applications
  savedCount: number; // Bookmarks/saves count
  featuredUntil?: number; // Featured listing expiry timestamp
  publishedAt?: number; // Publication timestamp
  lastModified: number; // Last modification timestamp
  version: number; // For optimistic updates
  isUrgent: boolean; // Priority flag
  isRemoteOnly: boolean; // Remote work requirement
}

// Complete gig creation interface
export interface CreateGigData {
  title: string;
  description: string;
  skills: string[];
  category: GigCategory;
  difficultyLevel: DifficultyLevel;
  experienceRequired: ExperienceLevel;
  budget: GigBudget;
  deadline?: number;
  estimatedDuration?: EstimatedDuration;
  applicationDeadline?: number;
  location?: GigLocation;
  metadata?: Partial<GigMetadata>;
}

// Gig update interface (partial updates)
export interface UpdateGigData extends Partial<CreateGigData> {
  status?: GigStatus;
}

// Gig search/filter interface
export interface GigFilters {
  status?: GigStatus | GigStatus[];
  category?: GigCategory | GigCategory[];
  experienceRequired?: ExperienceLevel | ExperienceLevel[];
  difficultyLevel?: DifficultyLevel | DifficultyLevel[];
  budgetMin?: number;
  budgetMax?: number;
  currency?: Currency;
  budgetType?: BudgetType;
  locationType?: LocationType;
  isRemoteOnly?: boolean;
  isUrgent?: boolean;
  skills?: string[];
  employerId?: Id<"users">;
  deadlineAfter?: number;
  deadlineBefore?: number;
  isFeatured?: boolean;
}

// Gig list item for efficient listing
export interface GigListItem {
  _id: Id<"gigs">;
  title: string;
  description: string;
  category: GigCategory;
  status: GigStatus;
  budget: GigBudget;
  skills: string[];
  deadline?: number;
  experienceRequired: ExperienceLevel;
  location?: GigLocation;
  metadata?: GigMetadata;
  _creationTime: number;
  employerId: Id<"users">;
}

// Gig statistics interface
export interface GigStats {
  totalGigs: number;
  activeGigs: number;
  completedGigs: number;
  totalViews: number;
  totalApplications: number;
  averageCompletionTime?: number;
  topCategories: Array<{
    category: GigCategory;
    count: number;
  }>;
}

// Helper type for gig status transitions
export type GigStatusTransition = {
  from: GigStatus;
  to: GigStatus;
  allowedRoles?: ("employer" | "freelancer" | "admin")[];
  requiresConfirmation?: boolean;
};

// Valid status transitions matrix
export const VALID_GIG_TRANSITIONS: GigStatusTransition[] = [
  { from: "draft", to: "open", allowedRoles: ["employer"] },
  { from: "open", to: "paused", allowedRoles: ["employer"] },
  { from: "paused", to: "open", allowedRoles: ["employer"] },
  { from: "open", to: "in_progress", allowedRoles: ["employer"] },
  { from: "in_progress", to: "in_review", allowedRoles: ["freelancer"] },
  {
    from: "in_review",
    to: "completed",
    allowedRoles: ["employer"],
    requiresConfirmation: true,
  },
  { from: "in_review", to: "in_progress", allowedRoles: ["employer"] },
  { from: "open", to: "cancelled", allowedRoles: ["employer", "admin"] },
  {
    from: "in_progress",
    to: "cancelled",
    allowedRoles: ["employer", "admin"],
    requiresConfirmation: true,
  },
];

// Export utility types
export type GigId = Id<"gigs">;
export type UserId = Id<"users">;
