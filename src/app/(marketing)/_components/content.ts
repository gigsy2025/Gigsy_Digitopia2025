import { type LucideIcon } from "lucide-react";
import {
  Activity,
  Briefcase,
  Clock3,
  Globe,
  Layers,
  LineChart,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";

export interface HeroStat {
  readonly label: string;
  readonly value: string;
  readonly description: string;
}

export interface FeatureHighlight {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly icon: LucideIcon;
  readonly outcome: string;
}

export interface SolutionShowcase {
  readonly title: string;
  readonly subtitle: string;
  readonly icon: LucideIcon;
  readonly benefits: readonly string[];
}

export interface WorkflowStage {
  readonly stage: string;
  readonly headline: string;
  readonly copy: string;
}

export interface Testimonial {
  readonly quote: string;
  readonly name: string;
  readonly role: string;
  readonly company: string;
}

export interface NarrativeBlock {
  readonly title: string;
  readonly subtitle: string;
  readonly bullets: readonly string[];
  readonly icon: LucideIcon;
}

export const heroStats: readonly HeroStat[] = [
  {
    label: "Verified Experts",
    value: "12k+",
    description: "Across 48 countries and 27 skill domains.",
  },
  {
    label: "Faster Hiring",
    value: "3.6x",
    description: "Median reduction in request-to-start time.",
  },
  {
    label: "Engagement Retention",
    value: "98%",
    description: "Quarter-over-quarter for enterprise clients.",
  },
] as const;

export const featureHighlights: readonly FeatureHighlight[] = [
  {
    id: "talent-graph",
    title: "Intelligent Talent Graph",
    description:
      "Blend verified experience, live availability, and AI enrichment to surface the exact specialists your teams need—instantly.",
    icon: Layers,
    outcome: "Cut sourcing cycles from weeks to hours.",
  },
  {
    id: "learning-journeys",
    title: "Adaptive Learning Journeys",
    description:
      "Deliver personalized upskilling paths that align with client goals, compliance, and emerging market demand.",
    icon: Sparkles,
    outcome: "Lift capability readiness by 42% in the first quarter.",
  },
  {
    id: "compliance",
    title: "Enterprise-Grade Compliance",
    description:
      "Track onboarding, certifications, and contract milestones with automated guardrails across every jurisdiction.",
    icon: ShieldCheck,
    outcome: "Stay audit-ready with real-time transparency.",
  },
  {
    id: "collaboration",
    title: "Unified Delivery Hub",
    description:
      "Align sales, staffing, learning, and finance teams in one collaborative workspace built for hybrid talent models.",
    icon: Users,
    outcome: "Increase cross-team velocity without sacrificing governance.",
  },
] as const;

export const solutionShowcases: readonly SolutionShowcase[] = [
  {
    title: "Talent & Gig Orchestration",
    subtitle:
      "Deploy the right team every time with live availability and predictive fit scoring.",
    icon: Activity,
    benefits: [
      "Smart matching that understands skill depth, certifications, and culture fit.",
      "One-click staffing workflows with automated approvals and compliance gates.",
      "Predictive demand planning that eliminates last-minute scrambles.",
    ],
  },
  {
    title: "Learning-Driven Upskilling",
    subtitle:
      "Power growth with curated academies, role-based pathways, and experiential learning loops.",
    icon: LineChart,
    benefits: [
      "Dynamic curriculum mapped to each client's outcomes and KPIs.",
      "Embedded assessments and feedback signals to measure impact in real time.",
      "Unified credential wallet that travels with every specialist across engagements.",
    ],
  },
  {
    title: "Financial Confidence",
    subtitle:
      "Give finance, legal, and executives full clarity from proposal to payment.",
    icon: Briefcase,
    benefits: [
      "Context-rich dashboards covering margin, utilization, and burn-down.",
      "Automated milestone billing tied to delivery artifacts and approvals.",
      "On-demand audit trail for every decision, signature, and payout.",
    ],
  },
] as const;

export const workflowStages: readonly WorkflowStage[] = [
  {
    stage: "01",
    headline: "Discover & Align",
    copy: "Intake the business challenge, map required competencies, and align stakeholders inside one shared workspace.",
  },
  {
    stage: "02",
    headline: "Match & Mobilize",
    copy: "AI-assisted matching surfaces proven specialists, while automated onboarding clears compliance in hours, not days.",
  },
  {
    stage: "03",
    headline: "Deliver & Elevate",
    copy: "Integrated project rooms, learning nudges, and live performance telemetry keep teams operating at peak velocity.",
  },
  {
    stage: "04",
    headline: "Measure & Grow",
    copy: "Executive dashboards tie revenue, talent health, and client satisfaction together for the next engagement cycle.",
  },
] as const;

export const testimonials: readonly Testimonial[] = [
  {
    quote:
      "Gigsy gave us the unified rhythm we've chased for years. We mobilize global squads in under 48 hours with zero compliance friction.",
    name: "Layla Chen",
    role: "VP, Talent Innovation",
    company: "Northstar Digital",
  },
  {
    quote:
      "Our consultants stay billable and engaged because learning, staffing, and finance finally speak the same language across regions.",
    name: "Victor Álvarez",
    role: "Chief Operating Officer",
    company: "Latitude Partners",
  },
  {
    quote:
      "The executive visibility is unmatched. We track profitability, skill depth, and delivery quality in real time—board-ready at any moment.",
    name: "Morgan Ellis",
    role: "Chief Transformation Officer",
    company: "Helix Advisory",
  },
] as const;

export const clientLogos: readonly string[] = [
  "Atlas Ventures",
  "NovaWorks",
  "Constellation AI",
  "BlueRiver Labs",
  "Orbit Collective",
  "Summit & Co.",
  "Helios Systems",
  "Bridgewater Studio",
] as const;

export const globalHighlights: readonly HeroStat[] = [
  {
    label: "Global Workspaces Activated",
    value: "184",
    description:
      "Spanning enterprise PMOs, learning academies, and delivery pods.",
  },
  {
    label: "Markets Served",
    value: "28",
    description: "From fintech and healthcare to next-gen climate innovation.",
  },
  {
    label: "Average ROI",
    value: "217%",
    description: "Realized within the first year of Gigsy adoption.",
  },
] as const;

export const globalExpansionNarrative: NarrativeBlock = {
  title: "Built for borderless collaboration",
  subtitle:
    "Gigsy orchestrates hybrid workforces, ensuring compliance, localization, and real-time insight no matter where you scale.",
  bullets: [
    "Localized compliance packs for each region without losing global control.",
    "Contextual insights merge delivery, learning, and revenue signals in one canvas.",
    "Continuous feedback loops keep crews future-ready across every engagement.",
  ] as const,
  icon: Globe,
};

export const timeToValueNarrative: NarrativeBlock = {
  title: "Time-to-value in weeks, not quarters",
  subtitle:
    "Enterprise templates, data migrations, and change playbooks accelerate adoption without disrupting in-flight engagements.",
  bullets: [
    "Launch with curated playbooks mapped to your operating model.",
    "Connect existing tools via open GraphQL and event streaming APIs.",
    "Measure progress with executive-ready scorecards from day one.",
  ] as const,
  icon: Clock3,
};

export const narrativeBlocks: readonly NarrativeBlock[] = [
  globalExpansionNarrative,
  timeToValueNarrative,
] as const;
