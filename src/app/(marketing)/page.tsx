import { CallToActionSection } from "./_components/call-to-action-section";
import {
  clientLogos,
  featureHighlights,
  globalHighlights,
  heroStats,
  narrativeBlocks,
  solutionShowcases,
  testimonials,
  workflowStages,
} from "./_components/content";
import { FeatureHighlightsSection } from "./_components/feature-highlights-section";
import { HeroSection } from "./_components/hero-section";
import { LogoWall } from "./_components/logo-wall";
import { NarrativeGrid } from "./_components/narrative-grid";
import { SolutionShowcaseSection } from "./_components/solution-showcase-section";
import { TestimonialsSection } from "./_components/testimonials-section";
import { WorkflowSection } from "./_components/workflow-section";

export default function HomePage() {
  return (
    <>
      <HeroSection stats={heroStats} />
      <LogoWall logos={clientLogos} />
      <FeatureHighlightsSection features={featureHighlights} />
      <SolutionShowcaseSection solutions={solutionShowcases} />
      <WorkflowSection stages={workflowStages} />
      <NarrativeGrid
        narratives={narrativeBlocks}
        supportingStats={globalHighlights}
      />
      <TestimonialsSection testimonials={testimonials} />
      <CallToActionSection />
    </>
  );
}
