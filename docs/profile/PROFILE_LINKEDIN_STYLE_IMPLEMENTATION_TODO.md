# LinkedIn-Style Profile Implementation Plan

## Context & Vision
- Deliver a LinkedIn-quality profile page that is responsive, theme-aware, and accessible.
- Prefer ShadCN primitives for UI; fall back to Kibo only when no ShadCN equivalent exists (dropzone, image zoom, rating, QR, marquee).
- Maintain strict type safety end-to-end via shared TypeScript contracts (Convex schema ⇄ generated types ⇄ frontend).
- Accelerate removal of the legacy `users.profile` snapshot by consolidating all reads/writes on the normalized profile tables.
- Integrate Windserf AI assistance for profile enrichment and autosuggestions with robust audit controls.

## Architecture Snapshot
### Frontend (`src/`)
- **Framework**: Next.js (App Router) + React + TypeScript.
- **UI Library**: ShadCN component library with Tailwind tokens + variants for theming.
- **Supplementary UI**: Kibo modules for dropzone, image zoom, rating, marquee, and QR.
- **State & Data**: Convex `preloadQuery` for SSR hydration, Convex client hooks for read-heavy access, and React Query only for editing flows (optimistic updates + cache invalidation). Maintain Suspense boundaries for progressive loading.
- **Directory Layout**:
  - `src/components/ProfileHeader/` (container/ui split + `types.ts`).
  - `src/components/ProfileAbout/`, `ProfileSkills/`, `ProfileExperience/`, `ProfileEducation/`, `ProfilePortfolio/`, `ProfileSidebar/` with consistent container/ui separation.
  - `src/components/common/` for reusable primitives (e.g., `AvatarCard`, `TimelineItem`, `DialogForm`).
  - `src/hooks/` for `useProfile`, `useProfileMutations`, ShadCN variant hooks, and AI suggestions.
  - `src/services/api.ts` for Convex wrapper, `src/services/windserf.ts` for AI integration.
  - `src/types/profile.ts` as the single source of truth for profile contracts.
  - `src/pages/profile/[slug].tsx` (or App Router equivalent) for the entry point.

### Backend (`convex/`)
- **Auth**: Leverage Clerk's ready-to-use auth helpers for ownership validation and session checks; wrap Convex mutations/queries with these utilities for consistent access control.
- **Data Model**: Existing tables `profiles`, `profileEducation`, `profileWorkExperience`, `profileProjects`, `profileLanguages` align with normalized structure. Ensure indexes support queries on skills, location, experience level, and recent activity.
- **Services**: Convex mutations/queries for CRUD, rate-limits.
- **Validation**: Server-side sanitization (`htmlSanitizer`, URL validation, MIME checks).

## Milestone Roadmap
- **Milestone Alpha (Foundational CRUD)**
  - Convex schema alignment + generated types.
  - `useProfile`/`useProfileMutations` hooks targeting normalized tables with snapshot read fallbacks only during migration window.
  - Profile header + about section UI with edit dialogs.
  - Privacy/visibility toggles (public/platform/private).
- **Milestone Beta (Rich Content & Activity Sync)**
  - Portfolio cards, experience timelines, education grid.
  - Windserf AI suggestions (skills auto-tag, bio improvements).
  - Media handling (dropzone, image zoom) with lazy-loaded bundles.
- **Milestone GA (Trust & Scale)**
  - Endorsements, ratings, certificates, languages panels.
  - Sidebar recommendations, marquee, QR share.
  - Performance budgets, accessibility audits, full test coverage.

## Task Breakdown & Checklist

### 1. Foundations & Contracts
- [ ] **Consolidate Types**: Author `src/types/profile.ts` mirroring Convex schema (interfaces for `Profile`, `EducationItem`, `WorkExperienceItem`, `PortfolioProject`, `Location`, etc.). Export shared enums (e.g., `ExperienceLevel`).
- [ ] **Convex Type Generation**: Regenerate `convex/_generated/` types after schema adjustments;
- [ ] **Validation Utilities**: Implement `src/utils/validators.ts` (zod schemas for URLs, timelines, string lengths) and `src/utils/htmlSanitizer.ts` (DOMPurify or similar integration, server + client usage).

### 2. Backend Enhancements (`convex/`)
- [ ] **Profile Query Layer**: Create `convex/profile.ts` with read models aggregating profile sections (joins across normalized tables, apply indexes in `schema.ts`).
- [ ] **Mutation Layer**: Implement mutations for profile upsert, education, work, portfolio, languages. Enforce ownership, rate limits.
- [ ] **Indexes Audit**: Ensure indexes exist for `skills`, `country`, `experienceLevel`, `lastActivityAt`, `visibility`, `availability.contractType`.

### 3. Frontend UI Composition (`src/components/`)
- [ ] **ProfileHeader/**
  - Container: fetch profile, derive edit permissions, pass props.
  - UI: ShadCN `Card`, `Avatar`, `Badge`, cover photo overlay; fallback to Kibo header only if required.
  - Tabs: ShadCN `Tabs` for Overview/Activity/Portfolio.
- [ ] **ProfileAbout/**
  - Rich text display with sanitized prose.
  - Edit dialog using ShadCN `Dialog` + TipTap editor (lazy-loaded) for inline editing.
- [ ] **ProfileSkills/**
  - Skill chips via ShadCN `Badge`, endorsements progress via `Progress`.
  - Integrate Windserf suggestions (AI assist panel) with optimistic updates + debounce.
- [ ] **ProfileExperience/**
  - Vertical timeline using ShadCN `Accordion` + custom Tailwind timeline markers.
  - Reusable `TimelineItem` in `components/common/`.
- [ ] **ProfileEducation/**
  - Mirror experience timeline; optional school avatar via ShadCN `Avatar`.
- [ ] **ProfilePortfolio/**
  - Responsive card grid, `Dialog` for project details.
  - Lazy-load Kibo Image Zoom; reuse existing shared `FileUpload` component for project media/document uploads (no bespoke dropzone reimplementation).
- [ ] **ProfileSidebar/**
  - Suggested gigs (ShadCN `Card` list), CTA buttons.
  - Kibo marquee for featured logos; QR generator for share.
- [ ] **Responsive Layout**
  - Compose layout in page entry: mobile single column, tablet dual column, desktop 3-column with CSS grid & Tailwind breakpoints.

### 4. Hooks & Services
- [ ] **Domain Layer (`src/services/profile/`)**: Introduce `ProfileRepository` (Convex data access, generated types only), `ProfileService` (business orchestration, caching strategy, validation hooks), and interfaces for testability. Ensure each class adheres to single responsibility and is dependency-injected into hooks.
- [ ] **useProfile.ts**: Compose the repository/service instances to expose a read-only hook leveraging Convex `preloadQuery` for SSR hydration plus a memoized selector API. Keep presentation logic out of the hook and return typed DTOs/derived view models.
- [ ] **useProfileMutations.ts**: Implement mutation hook backed by `ProfileService` methods, using React Query solely for mutation lifecycle, optimistic updates, and cache invalidation. Split optimistic state mapping into helper functions for clarity.
- [ ] **api.ts**: Provide a `ConvexClientFactory` that yields typed clients/repositories, handling authentication context, error normalization, and retry policies without leaking implementation details to the UI layer.


### 5. Theming & Styling
- [ ] **Tailwind Tokens**: Update `tailwind.config.js` to expose CSS variables for `--primary`, `--accent`, `--muted`, spacing, border radii to align with ShadCN theme.
- [ ] **Dark/Light Support**: Ensure components respond to `dark` class on `html`; provide skeleton states with accessible contrast.
- [ ] **Kibo Integration Styles**: Wrap Kibo components with adapters that map CSS variables to maintain visual consistency.

### 6. Performance & Loading Strategy
- [ ] **Code Splitting**: Dynamic import heavy modules (`TipTap`, `Dropzone`, `ImageZoom`, AI panels) with Suspense fallbacks.
- [ ] **Skeletons & Placeholders**: Implement ShadCN skeleton components for hero, experience lists, cards while data loads.
- [ ] **Caching**: Serve view-only traffic from Convex `preloadQuery` snapshots; scope React Query caching/invalidation to editing contexts and background revalidation after mutations.
- [ ] **Image Optimization**: Serve responsive avatars/screenshots via Next Image + CDN `srcset`; enforce upload size limits and compression.

### 7. Security & Validation
- [ ] **Sanitization**: Apply `htmlSanitizer` on server mutations and render pipeline.
- [ ] **Ownership Checks**: Guard all mutations to ensure `ctx.auth` matches `profile.userId`.
- [ ] **Rate Limiting**: Introduce mutation-level throttling (Convex rate limiter) for updates.
- [ ] **Audit Logging**: Log profile mutations with version numbers for reconciliation.


### 9. Documentation & Enablement
- [ ] **Docs**: Update `docs/profile/` with API reference, event schemas, migration notes, and enforce per-function/class/utility documentation (JSDoc/TSDoc) that captures contracts, parameters, return values, side effects, and usage examples (e.g.,
  ```ts
  /**
   * Format amount from smallest unit to human-readable string
   * @param amount - Amount in smallest unit (integer)
   * @param currency - Currency code
   * @param options - Formatting options
   * @returns Formatted string (e.g., "123.45")
   */
  ```
  ). Link to this plan from `USER_PROFILE_IMPLEMENTATION_PLAN.md`.
- [ ] **Runbooks**: Add operational guides covering AI failures, reconciliation jobs, privacy complaints.
- [ ] **Knowledge Sharing**: Schedule design/QA reviews, record demo once Alpha milestone ready.

## Dependencies & Risks
- **Windserf API Stability**: Coordinate with AI team for rate limits, fallbacks when unavailable.
- **Schema Migration**: Sequence updates to avoid downtime; apply feature flags for new read models.
- **Media Storage**: Ensure CDN and storage quotas cover portfolio uploads, and route every media mutation through the existing Convex file utilities (`convex/files.ts` — `generateUploadUrl`, `saveFileMetadata`, `getFileUrl`) instead of bespoke upload logic.
- **Privacy Compliance**: Confirm consent flows and removal pipelines are in place before GA.

## Next Immediate Actions
1. Align Convex schema with `src/types/profile.ts` interfaces; document any deltas.
2. Scaffold component directories with placeholder exports to unblock frontend work.
3. Implement baseline profile query against normalized tables and schedule snapshot removal migration.
4. Produce low-fidelity UI mocks (Figma/hand-off) to validate layout before coding.
