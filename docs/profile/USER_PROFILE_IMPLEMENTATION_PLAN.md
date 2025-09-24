# User Profile Implementation Plan

## Context & Goals
- **Purpose** Define a best-in-class identity hub for students, employers, and mentors that powers trust, personalization, and growth across the Gigsy platform.
- **Objectives** Deliver a complete digital portfolio, ensure seamless integration with Clerk and Convex, and enable real-time updates that feed recommendations, gamification, and employer decisioning.
- **Scope** Covers schema design, UX, event orchestration, privacy/permissions, trust signals, performance, and compliance readouts for the User Profile initiative.

## Delivery Principles
- **Single Source of Truth** Maintain profile state in Convex with generated TypeScript contracts to eliminate drift across services.
- **Event-Driven Architecture** Emit idempotent events for every mutation so downstream systems (embedding, recommendations, gamification) remain decoupled.
- **Defense in Depth** Enforce privacy, authentication, authorization, and audit trails at every layer to satisfy GDPR-like obligations.
- **Progressive Disclosure** Ship incrementally, measuring completion rates and feedback at each milestone to derisk adoption.
- **Quality Gates** Require automated testing, design reviews, and documentation updates before promoting changes to production.

## Migration & Dual-Write Strategy
- **Dual-Write Phase** Maintain `users.profile` as the read-optimized snapshot while introducing dedicated Convex tables (`profiles`, `profileEducation`, `profileWorkExperience`, `profileProjects`, `profileLanguages`) as the system of record.
- **Consistency Contracts** Wrap every profile mutation in shared helpers that atomically update both the snapshot and the normalized tables, with retry and alerting hooks.
- **Drift Detection** Emit structured logs/hashes after each mutation and schedule periodic reconciliation jobs. Flag divergence to observability dashboards with PagerDuty routing for P1 incidents.
- **Gradual Cutover** Gate reads from the dedicated tables behind feature flags. Once telemetry confirms stability, flip consumers to the new tables and schedule snapshot decommissioning.

## Phase 0 — Alignment & Foundations
- **Step 0.1 Engineering Discovery** Audit existing identity flows, Clerk integration, and Convex schema to identify reuse opportunities and migration constraints.
- **Step 0.2 Product & Design Alignment** Finalize UX wireframes, information hierarchy, and privacy copy with PM, UX, Legal, and Support stakeholders.
- **Step 0.3 Technical Blueprint** Publish architecture diagrams, sequence flows, and ADRs covering schema strategy, event topics, and embedding pipeline contracts.
- **Step 0.4 Tooling & Environments** Ensure development, staging, and load-test environments support Clerk webhooks, Convex dev deployments, and feature flag controls.
- **Step 0.5 Success Metric Baselines** Instrument current profile completeness, gig application rates, and employer satisfaction to track uplift.

## Workstream A — Profile Creation & Management
- **A1 Schema & Type Contracts** Design `Profile` schema, role taxonomy, and nested sections (skills, education, endorsements) with zod/TypeScript definitions and migration scripts.
- **A2 CRUD API Layer** Implement Convex mutations and queries for create/update/read, enforcing field-level validation and audit logging.
- **A3 Clerk Integration** Synchronize Clerk user lifecycle events, including onboarding scaffolds, profile photo ingestion, and account deactivation hooks.
- **A4 Profile Strength Engine** Build scoring service that evaluates completeness, surfaces actionable gaps, and stores contributing factors for analytics.
- **A5 Front-End Experience** Develop Next.js pages and modular components (`ProfileHeader`, `AboutSection`, `SkillMatrix`) with Suspense-ready data hooks.
- **A6 Normalized Profile Tables** Introduce dedicated Convex tables with indexes for `profiles`, `education`, `workExperience`, `portfolioProjects`, and `languages`, ensuring consistent versioning and schema evolution policies.
- **A7 Dual-Write Orchestration** Centralize profile mutation helpers that update both `users.profile` and normalized tables, applying optimistic locking and idempotency guards.

## Workstream B — Dynamic Portfolio & Activity Sync
- **B1 Event Contracts** Define `course.completed`, `gig.completed`, `badge.awarded`, and `profile.updated` payload schemas with versioning strategy.
- **B2 Outbox & Retry Infrastructure** Persist outbound events in Convex, implement replay/retry logic, and expose operational dashboards.
- **B3 Portfolio Aggregation Logic** Map inbound events to profile sections (certificates, gig history, badges) with deduping and timestamp ordering.
- **B4 Manual Contributions** Provide UI and API for users to add custom projects, media, and documents with storage and metadata validation.
- **B5 Embedding Regeneration** Trigger background jobs that update vector embeddings on relevant profile changes and verify latency SLAs.

## Workstream C — Trust & Verification
- **C1 Verification Framework** Model verification levels, provider metadata, expiry dates, and audit trails for email, phone, and future ID checks.
- **C2 Endorsements & Recommendations** Enable mentors/employers to submit attestations, enforce throttling, and surface reputation signals publicly.
- **C3 Moderation Tooling** Deliver admin interfaces for dispute handling, content takedown, and fraud detection cues with escalation workflows.
- **C4 Reputation Scoring** Combine endorsements, gig reviews, and completion history into a reputation index used by recommendations and employer filters.

## Workstream D — Privacy & Permission Controls
- **D1 Visibility Model** Implement ACL primitives for public, platform-only, and restricted sections with role-aware defaults.
- **D2 Granular Toggles** Provide per-section controls (e.g., GPA, badges, endorsements) with UX feedback and analytics events.
- **D3 Audit & Compliance** Log all profile data access, support GDPR export/delete requests, and document retention policies.
- **D4 Consent & Revocation** Track consent for LinkedIn/GitHub imports, support revocation flows, and cascade deletions to dependent services.
- **D5 Privacy Matrix** Publish a field-by-field visibility matrix mapping default access levels, override rules, and compliance annotations for each profile section.

## Workstream E — Integrations & Event Mesh
- **E1 Recommendations Interface** Publish contract for profile snapshots and embeddings, including freshness guarantees and failure alerts.
- **E2 Gamification Sync** Expose profile badge endpoints and subscription channels for real-time display within the profile UI.
- **E3 External Sharing** Generate public profile URLs, handle ISR cache invalidation on updates, and enforce robots/meta controls.
- **E4 Analytics & BI Feeds** Pipe profile changes to the data warehouse with lineage metadata for experimentation support.

## Workstream F — Search & Discovery
- **F1 Indexing Strategy** Define hybrid full-text + vector search indices, ensuring incremental updates and low-latency reads.
- **F2 Employer Browse Experience** Build filters for skills, reputation, availability, and recency with pagination and saved searches.
- **F3 Skill Taxonomy Governance** Align with AI team on canonical skill ontology and implement automated merging of near-duplicate skills.
- **F4 Observability** Track search performance, zero-result rates, and employer engagement metrics.

## Workstream G — Performance, Observability & Reliability
- **G1 Performance Budget** Set p95 load targets, define component-level budgets, and enforce via Lighthouse + synthetic testing.
- **G2 Caching & ISR Strategy** Configure ISR for public profiles, apply SWR caching for authenticated views, and implement cache busting on events.
- **G3 Telemetry** Instrument OpenTelemetry traces across Next.js, Convex, embedding services, and queue processing.
- **G4 Resiliency Testing** Run chaos and load scenarios to validate failover, retry, and degradation paths.

## Workstream H — Experience & Accessibility
- **H1 Responsive Layouts** Ensure optimal UX across mobile, tablet, and desktop with shared design tokens.
- **H2 Accessibility Compliance** Conduct WCAG 2.1 AA audits, add semantic landmarks, and provide accessible chart/table representations.
- **H3 Localization Readiness** Prepare content, labels, and currency/date formatting for future localization.

## Workstream I — Testing & Quality Assurance
- **I1 Unit & Integration Coverage** Build Convex unit tests, component tests (React Testing Library), and contract tests for event payloads.
- **I2 End-to-End Scenarios** Automate profile creation, editing, privacy toggles, and employer review flows in Playwright.
- **I3 Regression Safeguards** Establish snapshot tests for profile layouts and data fixtures for deterministic builds.
- **I4 Release Management** Implement feature flags, canary rollouts, and rollback scripts.

## Workstream J — Documentation & Enablement
- **J1 Technical Documentation** Maintain `docs/PROFILE_README.md` with API references, event schemas, and onboarding instructions.
- **J2 Runbooks** Create operational runbooks for embedding failures, cache invalidation, and compliance requests.
- **J3 Cross-Team Playbooks** Publish integration guides for AI/Recommendations, Gamification, and Employer Success teams.
- **J4 Training & Knowledge Sharing** Host brown-bag sessions, design reviews, and recorded demos to align stakeholders.

## Milestones & Governance
- **Milestone Alpha (Foundational CRUD)** Complete Workstream A + D1 with dual-write helpers live, profile completeness scoring enabled, and privacy matrix approved for internal dogfooding.
- **Milestone Beta (Activity Sync)** Ship Workstreams B + E1 + F1 behind feature flag, validate embedding regeneration SLAs, and pilot employer browse flows with analytics dashboards.
- **Milestone GA (Trust & Scale)** Finalize Workstreams C, G, H, and I, pass security/accessibility sign-off, demonstrate zero drift between snapshot and normalized tables for 30 days, and launch broadly.
- **Continuous Improvement** Iterate on recommendations, profile insights, and advanced verification per success metrics.

## Risks & Mitigations
- **Schema Drift Across Services** Centralize type definitions in shared packages and add schema diff checks to CI.
- **Real-Time Event Flooding** Implement rate limits, batching, and backpressure controls for high-frequency updates.
- **Privacy Misconfiguration** Default to least privilege, run automated privacy regression tests, and include manual QA scripts.
- **Embedding Latency** Monitor embedding SLA dashboards and provision autoscaling rules with circuit breakers.
- **Dual-Write Divergence** Add transactional wrappers, retries, and reconciliation checks to ensure `users.profile` and normalized tables remain consistent.

## Next Steps
- **Kickoff Review** Present this plan to cross-functional stakeholders for sign-off and backlog creation.
- **Roadmap Decomposition** Translate deep-dive steps into Jira epics/stories with engineering estimates and dependencies.
- **Pilot Execution** Identify a controlled cohort for Beta, define feedback loops, and establish release comms cadence.
- **Schema Blueprint Publication** Share Convex table definitions and dual-write helper contracts with partner teams to accelerate integration.
