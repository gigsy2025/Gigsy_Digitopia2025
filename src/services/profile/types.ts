import type { ExperienceLevel, PortfolioProject } from "@/types/profile";

export interface ProfileSummary {
  userId: string;
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
    contractType?: "freelance" | "part-time" | "full-time";
    availableFrom?: string;
  };
  visibility?: "public" | "platform" | "private";
  social?: {
    websiteUrl?: string;
    githubUrl?: string;
    linkedinUrl?: string;
  };
}

export interface ProfileAboutSection {
  bio?: string;
  highlights?: string[];
}

export interface ProfileSkill {
  name: string;
  endorsementStrength?: number;
  experienceLevel?: ExperienceLevel;
  endorsementsCount?: number;
}

export interface ProfileExperienceItem {
  id: string;
  companyName: string;
  role: string;
  start: string;
  end?: string;
  description?: string;
  logoUrl?: string;
  technologies?: string[];
}

export interface ProfileEducationItem {
  id: string;
  schoolName: string;
  degree: string;
  start: string;
  end?: string;
  logoUrl?: string;
}

export interface ProfileLanguage {
  code: string;
  name: string;
  level: "basic" | "conversational" | "fluent" | "native";
}

export interface ProfileProjectCard extends PortfolioProject {
  id: string;
  summary?: string;
  screenshots?: string[];
}

export interface SidebarGigRecommendation {
  id: string;
  title: string;
  company: string;
  location?: string;
  commitment?: string;
  url: string;
}

export interface ProfileSidebarData {
  gigs: SidebarGigRecommendation[];
  featuredLogos: string[];
  qrCodeUrl?: string;
  contactEmail?: string;
  badges?: string[];
}

export interface ProfileViewModel {
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
}
