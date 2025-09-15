/**
 * SKILLS ONBOARDING SYSTEM TYPE DEFINITIONS
 *
 * Comprehensive type-safe system for skills management, onboarding UI,
 * and profile enhancement with validation and analytics support.
 *
 * @author Principal Engineer
 * @version 1.0.0
 * @since 2025-01-14
 */

import { z } from "zod";

/**
 * Core skill definition with metadata
 */
export interface Skill {
  /** Unique skill identifier */
  id: string;

  /** Display name for the skill */
  name: string;

  /** Skill category for organization */
  category: SkillCategory;

  /** Alternative names and synonyms for search */
  aliases?: readonly string[];

  /** Brief description of the skill */
  description?: string;

  /** Whether this skill is popular/trending */
  isPopular?: boolean;

  /** Number of users with this skill */
  userCount?: number;

  /** Related skills for suggestions */
  relatedSkills?: readonly string[];
}

/**
 * Skill categories for organization
 */
export type SkillCategory =
  | "development"
  | "design"
  | "marketing"
  | "writing"
  | "data"
  | "business"
  | "creative"
  | "language"
  | "technical"
  | "soft-skills";

/**
 * User's skill profile with experience levels
 */
export interface UserSkill {
  /** Skill identifier */
  skillId: string;

  /** User's proficiency level */
  level: SkillLevel;

  /** Years of experience */
  yearsOfExperience?: number;

  /** When skill was added to profile */
  addedAt: Date;

  /** Whether skill is featured on profile */
  isFeatured?: boolean;

  /** Endorsements or validations */
  endorsements?: number;
}

/**
 * Skill proficiency levels
 */
export type SkillLevel = "beginner" | "intermediate" | "advanced" | "expert";

/**
 * Skills onboarding session state
 */
export interface SkillsOnboardingState {
  /** Currently selected skills */
  selectedSkills: string[];

  /** Search query for skills */
  searchQuery: string;

  /** Selected category filter */
  categoryFilter: SkillCategory | "all";

  /** Whether onboarding is complete */
  isComplete: boolean;

  /** Current step in multi-step flow */
  currentStep: number;

  /** Total steps in onboarding */
  totalSteps: number;
}

/**
 * Zod schemas for runtime validation
 */

/**
 * Schema for skill selection form
 */
export const SkillsFormSchema = z.object({
  skills: z
    .array(z.string())
    .min(1, {
      message: "Please select at least one skill to continue.",
    })
    .max(20, {
      message: "You can select up to 20 skills maximum.",
    }),
  experienceLevel: z
    .enum(["beginner", "intermediate", "advanced", "expert"])
    .optional(),
  interestedInLearning: z.array(z.string()).optional(),
  careerGoals: z.string().max(500).optional(),
});

/**
 * Inferred TypeScript type from Zod schema
 */
export type SkillsFormData = z.infer<typeof SkillsFormSchema>;

/**
 * Skill search and filtering options
 */
export interface SkillsSearchOptions {
  /** Search query string */
  query?: string;

  /** Category filter */
  category?: SkillCategory | "all";

  /** Maximum results to return */
  limit?: number;

  /** Whether to include popular skills */
  includePopular?: boolean;

  /** Exclude already selected skills */
  excludeSelected?: string[];
}

/**
 * Skills catalog response from API
 */
export interface SkillsCatalogResponse {
  /** Available skills */
  skills: Skill[];

  /** Popular/trending skills */
  popularSkills: Skill[];

  /** Skills organized by category */
  categories: Record<SkillCategory, Skill[]>;

  /** Total count for pagination */
  totalCount: number;
}

/**
 * Analytics event for skills tracking
 */
export interface SkillsAnalyticsEvent {
  /** Event type */
  action:
    | "onboarding_started"
    | "skill_selected"
    | "skill_removed"
    | "onboarding_completed"
    | "onboarding_skipped";

  /** Selected skills (if applicable) */
  skillIds?: string[];

  /** User's experience level */
  experienceLevel?: SkillLevel;

  /** Time spent in onboarding (seconds) */
  timeSpent?: number;

  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Cookie management for session persistence
 */
export interface SkillsSessionCookie {
  /** Whether skills onboarding was completed */
  skillsOnboarded: boolean;

  /** Timestamp of completion */
  completedAt: number;

  /** Expiry timestamp */
  expiresAt: number;

  /** Session identifier */
  sessionId: string;
}

/**
 * Convex database mutations payload
 */
export interface UpdateUserSkillsPayload {
  /** User's Clerk ID */
  clerkId: string;

  /** Selected skills array */
  skills: string[];

  /** User's general experience level */
  experienceLevel?: SkillLevel;

  /** Additional profile data */
  profileData?: {
    careerGoals?: string;
    interestedInLearning?: string[];
  };
}

/**
 * Skills recommendation data
 */
export interface SkillsRecommendation {
  /** Recommended skills */
  skills: Skill[];

  /** Reason for recommendation */
  reason: "popular" | "related" | "career-path" | "market-demand";

  /** Confidence score (0-1) */
  confidence: number;

  /** Supporting data */
  metadata?: Record<string, unknown>;
}

/**
 * Props for skills onboarding modal component
 */
export interface SkillsOnboardingModalProps {
  /** Whether modal is open */
  isOpen: boolean;

  /** Function to close modal */
  onClose: () => void;

  /** Initial selected skills */
  initialSkills?: string[];

  /** Callback when onboarding is completed */
  onComplete: (data: SkillsFormData) => Promise<void>;

  /** Callback when onboarding is skipped */
  onSkip?: () => void;

  /** Whether to show skip option */
  allowSkip?: boolean;

  /** Custom title for modal */
  title?: string;

  /** Custom description */
  description?: string;

  /** Analytics tracking function */
  onAnalytics?: (event: SkillsAnalyticsEvent) => void;
}

/**
 * Skills check component state
 */
export interface SkillsCheckState {
  /** Whether to show onboarding modal */
  shouldShowOnboarding: boolean;

  /** Whether check is complete */
  isCheckComplete: boolean;

  /** Error during check */
  checkError: Error | null;

  /** User has skills */
  hasSkills: boolean;

  /** Session cookie exists */
  hasSessionCookie: boolean;
}

/**
 * Return type for useSkillsService hook
 */
export interface UseSkillsService {
  /** Current user data from Convex */
  user: {
    _id: string;
    _creationTime: number;
    clerkId: string;
    email: string;
    name: string;
    avatarUrl?: string;
    profile?: {
      skills?: string[];
      experienceLevel?: SkillLevel;
      bio?: string;
      headline?: string;
      completeness?: number;
      lastUpdated?: number;
    };
  } | null;

  /** Available skills catalog */
  skillsCatalog: Skill[];

  /** Popular skills */
  popularSkills: Skill[];

  /** Loading state */
  isLoading: boolean;

  /** Saving state */
  isSaving: boolean;

  /** Error state */
  error: Error | null;

  /** Search skills function */
  searchSkills: (options: SkillsSearchOptions) => Promise<Skill[]>;

  /** Save skills function */
  saveSkills: (data: SkillsFormData) => Promise<void>;

  /** Get recommendations function */
  getRecommendations: (
    selectedSkills: string[],
  ) => Promise<SkillsRecommendation[]>;

  /** Track analytics event */
  trackEvent: (event: SkillsAnalyticsEvent) => void;
}

export default SkillsFormSchema;
