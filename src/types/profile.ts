/**
 * Profile Data Types for Career Growth Service
 *
 * These types define the structure of user profile data owned by the Career Growth Service.
 * They correspond to the profile schema defined in convex/schema.ts and provide compile-time
 * type safety for profile-related operations.
 */

/**
 * Enumeration of experience levels for skill assessment and matching
 */
export type ExperienceLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "expert";

/**
 * Geographic location data for user matching and timezone coordination
 */
export interface Location {
  /** ISO country code or full country name */
  country: string;
  /** City name */
  city: string;
  /** IANA timezone identifier (e.g., "Africa/Cairo", "America/New_York") */
  timezone: string;
}

/**
 * Educational background entry
 */
export interface Education {
  /** Institution name */
  school: string;
  /** Degree type and field (e.g., "Bachelor of Computer Science") */
  degree: string;
  /** Start date in ISO format or "YYYY-MM" format */
  start: string;
  /** End date, undefined for ongoing education */
  end?: string;
}

/**
 * Professional work experience entry
 */
export interface WorkExperience {
  /** Company or organization name */
  company: string;
  /** Job title or position */
  role: string;
  /** Start date in ISO format or "YYYY-MM" format */
  start: string;
  /** End date, undefined for current position */
  end?: string;
  /** Brief description of role and achievements */
  description?: string;
}

/**
 * Portfolio project entry (lightweight snapshot)
 */
export interface PortfolioProject {
  /** Project name */
  title: string;
  /** Project URL or demo link */
  url?: string;
  /** Brief project description */
  description?: string;
  /** Technologies and tools used */
  technologies?: string[];
}

/**
 * Portfolio snapshot containing key professional links and projects
 * Note: Full portfolio history is maintained in a separate service
 */
export interface Portfolio {
  /** Array of key projects */
  projects: PortfolioProject[];
  /** Personal website or portfolio site URL */
  websiteUrl?: string;
  /** GitHub profile URL */
  githubUrl?: string;
  /** LinkedIn profile URL */
  linkedinUrl?: string;
}

/**
 * Complete user profile data structure
 * This represents the profile object stored in the users table
 */
export interface UserProfile {
  /** Short professional introduction */
  bio?: string;
  /** Professional headline (e.g., "Frontend Engineer & Medical Student") */
  headline?: string;
  /** Geographic location and timezone information */
  location?: Location;
  /** Normalized list of canonical skills for matching */
  skills: string[];
  /** Current experience level for skill assessment */
  experienceLevel: ExperienceLevel;
  /** Educational background history */
  education: Education[];
  /** Professional work experience history */
  workExperience: WorkExperience[];
  /** Portfolio snapshot with key projects and links */
  portfolio?: Portfolio;
}

/**
 * Partial profile for update operations
 * Allows updating individual sections of the profile
 */
export type UserProfileUpdate = Partial<UserProfile>;

/**
 * Helper type for profile completeness checking
 */
export interface ProfileCompleteness {
  /** Whether basic info (bio, headline) is complete */
  basicInfo: boolean;
  /** Whether location information is provided */
  location: boolean;
  /** Whether skills are specified */
  skills: boolean;
  /** Whether education history is provided */
  education: boolean;
  /** Whether work experience is provided */
  workExperience: boolean;
  /** Whether portfolio information is provided */
  portfolio: boolean;
  /** Overall completion percentage (0-100) */
  completionPercentage: number;
}

/**
 * Search filters for profile-based matching
 */
export interface ProfileSearchFilters {
  /** Filter by specific skills */
  skills?: string[];
  /** Filter by experience level */
  experienceLevel?: ExperienceLevel | ExperienceLevel[];
  /** Filter by location (country or city) */
  location?: {
    country?: string;
    city?: string;
  };
  /** Filter by education level or institution */
  education?: {
    degree?: string;
    school?: string;
  };
}
