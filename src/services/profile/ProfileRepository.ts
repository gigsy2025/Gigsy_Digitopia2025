import type { Id } from "convex/_generated/dataModel";

import type { ProfileViewModel } from "./types";
import type { ProfileQueryOptions } from "./profileFetchers";
import {
  fetchProfileBySlug as convexFetchProfileBySlug,
  fetchProfileByUserId as convexFetchProfileByUserId,
  createProfileMutation as convexCreateProfile,
} from "./profileFetchers";
import type { ProfileCreationInput } from "shared/profile/profileCreationSchema";

/**
 * Abstraction over the data source powering profile reads.
 */
export interface ProfileRepository {
  fetchProfileBySlug(slug: string): Promise<ProfileViewModel | null>;
  fetchProfileByUserId(userId: Id<"users">): Promise<ProfileViewModel | null>;
  createProfile(input: ProfileCreationInput): Promise<ProfileViewModel>;
}

/**
 * Options accepted by the Convex-backed repository.
 */
export type ConvexProfileRepositoryOptions = ProfileQueryOptions;

/**
 * Error surfaced when profile data cannot be retrieved from Convex.
 */
export class ProfileDataAccessError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = "ProfileDataAccessError";
  }
}

const shouldUseMockRepository =
  process.env.NEXT_PUBLIC_PROFILE_MOCK === "true" ||
  process.env.PROFILE_DATA_SOURCE === "mock";

/**
 * Convex-backed implementation that fetches a normalized profile view model.
 */
export class ConvexProfileRepository implements ProfileRepository {
  constructor(private readonly options: ConvexProfileRepositoryOptions = {}) {}

  async fetchProfileBySlug(slug: string): Promise<ProfileViewModel | null> {
    if (!slug?.trim()) {
      return null;
    }

    try {
      return convexFetchProfileBySlug(slug, this.options);
    } catch (error) {
      throw new ProfileDataAccessError(
        `[ConvexProfileRepository] Failed to fetch profile for slug "${slug}"`,
        { cause: error },
      );
    }
  }

  async fetchProfileByUserId(
    userId: Id<"users">,
  ): Promise<ProfileViewModel | null> {
    try {
      return convexFetchProfileByUserId(userId, this.options);
    } catch (error) {
      throw new ProfileDataAccessError(
        `[ConvexProfileRepository] Failed to fetch profile for user "${userId}"`,
        { cause: error },
      );
    }
  }

  async createProfile(input: ProfileCreationInput): Promise<ProfileViewModel> {
    try {
      return convexCreateProfile(input);
    } catch (error) {
      throw new ProfileDataAccessError(
        "[ConvexProfileRepository] Failed to create profile",
        { cause: error },
      );
    }
  }
}

/**
 * Lightweight in-memory repository used for local development or fallback flows.
 */
export class InMemoryProfileRepository implements ProfileRepository {
  async fetchProfileBySlug(slug: string): Promise<ProfileViewModel | null> {
    if (!slug?.trim()) {
      return null;
    }

    return buildMockProfile(slug);
  }

  async fetchProfileByUserId(): Promise<ProfileViewModel | null> {
    return buildMockProfile("mock-user");
  }

  async createProfile(): Promise<ProfileViewModel> {
    return buildMockProfile("mock-user");
  }
}

export function createProfileRepository(
  options?: ConvexProfileRepositoryOptions,
): ProfileRepository {
  if (shouldUseMockRepository) {
    return new InMemoryProfileRepository();
  }

  return new ConvexProfileRepository(options);
}

function buildMockProfile(slug: string): ProfileViewModel {
  const lastUpdated = new Date().toISOString();

  return {
    summary: {
      userId: "user_mock_123",
      slug,
      fullName: "Alex Morgan",
      headline: "Senior Frontend Engineer · Design Systems Specialist",
      location: {
        city: "San Francisco",
        country: "US",
        timezone: "America/Los_Angeles",
      },
      avatarUrl: "https://api.dicebear.com/7.x/initials/svg?seed=Alex%20Morgan",
      coverImageUrl:
        "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1600&q=80",
      experienceLevel: "expert",
      stats: {
        completeness: 86,
        lessonsCompleted: 42,
        lastUpdated,
      },
      availability: {
        hoursPerWeek: 25,
        contractType: "freelance",
        availableFrom: lastUpdated,
      },
      visibility: "public",
      social: {
        websiteUrl: "https://alexmorgan.io",
        githubUrl: "https://github.com/alexmorgan",
        linkedinUrl: "https://linkedin.com/in/alexmorgan",
      },
    },
    about: {
      bio: "Product-focused engineer crafting accessible, resilient web experiences. Previously scaled design systems for global marketplaces and fintech teams.",
      highlights: [
        "Shipped cross-platform design system adopted by 40+ squads",
        "Led performance program reducing LCP by 35%",
        "Mentored 12 engineers transitioning into frontend roles",
      ],
    },
    skills: [
      {
        name: "React",
        endorsementStrength: 95,
        experienceLevel: "expert",
        endorsementsCount: 32,
      },
      {
        name: "Design Systems",
        endorsementStrength: 92,
        experienceLevel: "expert",
        endorsementsCount: 18,
      },
      {
        name: "TypeScript",
        endorsementStrength: 88,
        experienceLevel: "advanced",
        endorsementsCount: 27,
      },
      {
        name: "Accessibility",
        endorsementStrength: 76,
        experienceLevel: "advanced",
        endorsementsCount: 14,
      },
    ],
    experience: [
      {
        id: "exp-1",
        companyName: "Nimbus Labs",
        role: "Principal Frontend Engineer",
        start: "2021-05",
        description:
          "Scaled component platform to serve multi-brand marketplace, owning accessibility and performance budgets.",
        technologies: ["React", "TypeScript", "Storybook", "Turborepo"],
      },
      {
        id: "exp-2",
        companyName: "Vector Ventures",
        role: "Lead UI Engineer",
        start: "2018-03",
        end: "2021-04",
        description:
          "Introduced collaborative workflows uniting design and engineering; delivered critical investor dashboards.",
        technologies: ["Next.js", "GraphQL", "Chakra UI"],
      },
    ],
    education: [
      {
        id: "edu-1",
        schoolName: "Stanford University",
        degree: "B.S. Computer Science",
        start: "2012-09",
        end: "2016-06",
      },
    ],
    languages: [
      { code: "en", name: "English", level: "native" },
      { code: "es", name: "Spanish", level: "fluent" },
    ],
    portfolio: {
      projects: [
        {
          id: "proj-1",
          title: "Aurora UI Framework",
          description:
            "Design system powering multi-brand commerce experiences with themable foundations and testable primitives.",
          technologies: ["React", "Radix UI", "Tailwind"],
          url: "https://aurora-ui.dev",
          summary:
            "Design system framework with live docs and usage analytics.",
          screenshots: [
            "https://images.unsplash.com/photo-1559028012-481c04fa702d?auto=format&fit=crop&w=1200&q=80",
          ],
        },
        {
          id: "proj-2",
          title: "Pulse Analytics Dashboard",
          description:
            "Real-time operational dashboard for monitoring marketplace health with custom viz toolkit.",
          technologies: ["Next.js", "D3", "Convex"],
          url: "https://pulse-analytics.app",
          summary: "Operational analytics with real-time feeds and alerting.",
          screenshots: [
            "https://images.unsplash.com/photo-1517433456452-f9633a875f6f?auto=format&fit=crop&w=1200&q=80",
          ],
        },
      ],
    },
    sidebar: {
      gigs: [
        {
          id: "gig-1",
          title: "Design System Architect",
          company: "Atlas Studios",
          location: "Remote",
          commitment: "Full-time",
          url: "https://gigsy.example.com/gigs/design-system-architect",
        },
        {
          id: "gig-2",
          title: "Senior Frontend Consultant",
          company: "Bloom Partners",
          location: "Remote",
          commitment: "Contract",
          url: "https://gigsy.example.com/gigs/frontend-consultant",
        },
      ],
      featuredLogos: [
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=200&q=80",
        "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=200&q=80",
      ],
      qrCodeUrl:
        "https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://gigsy.dev/profile/alex",
      contactEmail: "alex@gigsy.dev",
      badges: ["Top Mentor", "100% Response"],
    },
  };
}
