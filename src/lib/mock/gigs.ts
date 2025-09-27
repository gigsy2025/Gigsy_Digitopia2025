import type { Id } from "convex/_generated/dataModel";
import type {
  GigListItem,
  DifficultyLevel,
  GigCategory,
  GigBudget,
  ExperienceLevel,
  GigMetadata,
  LocationType,
  GigDetail,
} from "@/types/gigs";

export type GigDetailStub = GigDetail;

export type GigApplicationStatus =
  | "submitted"
  | "review"
  | "interview"
  | "offered"
  | "rejected";

export interface GigApplicationStub {
  id: string;
  gig: GigDetailStub;
  status: GigApplicationStatus;
  appliedAt: string;
  lastUpdatedAt?: string;
  notes?: string;
}

const createBudget = (
  min: number,
  max: number,
  type: GigBudget["type"],
  currency: GigBudget["currency"],
): GigBudget => ({
  min,
  max,
  type,
  currency,
});

const createMetadata = (overrides?: Partial<GigMetadata>): GigMetadata => ({
  views: 0,
  applicantCount: 0,
  savedCount: 0,
  lastModified: Date.now(),
  version: 1,
  isUrgent: false,
  isRemoteOnly: true,
  ...overrides,
});

const createGigId = (value: string) => value as Id<"gigs">;
const createUserId = (value: string) => value as Id<"users">;

const baseSkills: Record<GigCategory, string[]> = {
  design: ["figma", "ui", "ux", "branding"],
  development: ["typescript", "next.js", "graphql", "tailwind"],
  writing: ["seo", "copywriting", "blog", "editing"],
  marketing: ["analytics", "campaigns", "email", "crm"],
  data: ["python", "sql", "analytics", "ml"],
  video: ["premiere", "after effects", "storyboarding"],
  audio: ["mixing", "podcast", "voiceover"],
  business: ["strategy", "financial modeling", "presentations"],
  other: ["research", "coordination"],
};

const makeGig = ({
  id,
  title,
  category,
  difficultyLevel,
  experienceRequired,
  budget,
  employerId,
  status = "open",
  isUrgent = false,
  locationType = "remote",
}: {
  id: string;
  title: string;
  category: GigCategory;
  difficultyLevel: DifficultyLevel;
  experienceRequired: ExperienceLevel;
  budget: GigBudget;
  employerId: string;
  status?: GigListItem["status"];
  isUrgent?: boolean;
  locationType?: LocationType;
}): GigDetailStub => ({
  _id: createGigId(id),
  _creationTime: Date.now(),
  title,
  description:
    "Help us ship the next release milestone. Collaborate with cross-functional teams and deliver measurable impact.",
  longDescription:
    "We are looking for a contractor to accelerate delivery. You will work with product, design, and engineering to build delightful experiences. We value pragmatic problem solvers who can move quickly while maintaining quality.",
  category,
  difficultyLevel,
  experienceRequired,
  status,
  budget,
  skills: baseSkills[category],
  metadata: createMetadata({
    isUrgent,
    isRemoteOnly: locationType === "remote",
  }),
  employerId: createUserId(employerId),
  location:
    locationType === "remote"
      ? { type: "remote" }
      : {
          type: locationType,
          country: "EG",
          city: "Cairo",
          timezone: "Africa/Cairo",
        },
  requirements: [
    "Demonstrated ownership of end-to-end delivery",
    "Ability to communicate clearly with stakeholders",
    "Comfortable working across timezones",
  ],
  responsibilities: [
    "Partner with product managers to clarify scope",
    "Implement responsive UI with strong attention to detail",
    "Collaborate with QA to ensure quality releases",
  ],
  perks: [
    "Long-term collaboration potential",
    "Remote-friendly",
    "Weekly payouts",
  ],
});

const mockGigDetails: GigDetailStub[] = [
  makeGig({
    id: "gig_1",
    title: "Senior Frontend Engineer for FinTech Dashboard",
    category: "development",
    difficultyLevel: "advanced",
    experienceRequired: "senior",
    budget: createBudget(1500, 2500, "fixed", "USD"),
    employerId: "user_1",
    isUrgent: true,
  }),
  makeGig({
    id: "gig_2",
    title: "Brand Identity Refresh for Healthcare Startup",
    category: "design",
    difficultyLevel: "intermediate",
    experienceRequired: "intermediate",
    budget: createBudget(800, 1200, "milestone", "EUR"),
    employerId: "user_2",
  }),
  makeGig({
    id: "gig_3",
    title: "SEO Content Specialist for Education Platform",
    category: "writing",
    difficultyLevel: "beginner",
    experienceRequired: "entry",
    budget: createBudget(300, 600, "hourly", "EGP"),
    employerId: "user_1",
  }),
  makeGig({
    id: "gig_4",
    title: "Data Analyst for Marketplace Insights",
    category: "data",
    difficultyLevel: "advanced",
    experienceRequired: "senior",
    budget: createBudget(1200, 2000, "fixed", "USD"),
    employerId: "user_3",
    status: "draft",
  }),
];

export async function getMockGigList(): Promise<GigListItem[]> {
  return mockGigDetails;
}

export async function getMockGigDetail(
  gigId: string,
): Promise<GigDetailStub | null> {
  const targetId = gigId as Id<"gigs">;
  return mockGigDetails.find((gig) => gig._id === targetId) ?? null;
}

export async function getMockEmployerGigs(
  employerId: string,
): Promise<GigListItem[]> {
  const targetId = employerId as Id<"users">;
  return mockGigDetails.filter((gig) => gig.employerId === targetId);
}

export async function getMockRecommendedGigs(
  gigId: string,
  limit = 3,
): Promise<GigListItem[]> {
  const detail = await getMockGigDetail(gigId);
  return mockGigDetails
    .filter((gig) => gig._id !== (gigId as Id<"gigs">))
    .filter((gig) => (detail ? gig.category === detail.category : true))
    .slice(0, limit);
}

export const MOCK_APPLICATIONS: GigApplicationStub[] = [
  {
    id: "application_1",
    gig: mockGigDetails[0]!,
    status: "submitted",
    appliedAt: new Date().toISOString(),
  },
  {
    id: "application_2",
    gig: mockGigDetails[1]!,
    status: "review",
    appliedAt: new Date(Date.now() - 86_400_000).toISOString(),
    lastUpdatedAt: new Date().toISOString(),
  },
];
