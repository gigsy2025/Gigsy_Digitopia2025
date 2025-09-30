# Application Status Lifecycle & Canonical Constants

## 👋 Overview

This document defines the single source of truth for the Gigsy application lifecycle. It captures the canonical status constants, display labels, and ordering semantics that power both candidate and employer experiences. Engineering teams must align any new data models, APIs, or UI flows with this reference to maintain a consistent hiring pipeline.

## 📍 Source of Truth

- **Constants module:** `src/types/applications.ts`
- **Exports:**
  - `APPLICATION_STATUS_ORDER`
  - `APPLICATION_STATUS_LABELS`
- **Usage contract:** These exports are consumed by Convex modules, Next.js servers, React components, and analytics reporting. Do not hardcode status strings or labels elsewhere.

## 🔁 Status Lifecycle

| Status | Label | Description |
| --- | --- | --- |
| `pending` | Pending | Application was created but not yet viewed by the employer. |
| `viewed` | Viewed | Employer reviewed the application without changing its decision state. |
| `submitted` | Submitted | Candidate submitted the application; default entry state in legacy flows. |
| `in_review` | In review | Employer or hiring team is actively assessing the application. |
| `shortlisted` | Shortlisted | Candidate was shortlisted and moved forward in the funnel. |
| `interview_requested` | Interview requested | Employer requested an interview or further screening. |
| `hired` | Hired | Candidate was hired for the gig. |
| `assigned` | Assigned | Candidate has been assigned specific work or milestones. |
| `rejected` | Rejected | Employer declined the application. |
| `withdrawn` | Withdrawn | Candidate retracted their application. |
| `closed` | Closed | Application was closed administratively (e.g., gig cancelled). |

> **Ordering:** `APPLICATION_STATUS_ORDER` preserves the sequence above. Use it when sorting pipelines, grouping analytics, or rendering filter menus.

## ✅ Implementation Guidance

- **Access via imports:**
  ```ts
  import {
    APPLICATION_STATUS_LABELS,
    APPLICATION_STATUS_ORDER,
    type ApplicationStatus,
  } from "@/types/applications";
  ```
- **UI components:** Always derive labels (`APPLICATION_STATUS_LABELS[status]`) and badge variants from the canonical constants. Never inline user-facing copy for statuses.
- **Convex modules:** Validate incoming status transitions against `APPLICATION_STATUS_ORDER` rather than ad-hoc unions.
- **Analytics:** When aggregating metrics, rely on the exported order to ensure consistent charts and comparisons.

## 🔄 Change Management

1. Update `APPLICATION_STATUS_ORDER` and `APPLICATION_STATUS_LABELS` together. The index in `APPLICATION_STATUS_ORDER` determines lifecycle progression.
2. Run `pnpm typecheck` to surface any gaps caused by newly introduced statuses.
3. Audit Convex schema unions (e.g., `convex/schema.ts`) to ensure the new literal is included.
4. Notify FE and data teams so they can refresh dashboards or filters dependent on the sequence.

## 📚 Related References

- `convex/schema.ts` – authoritative schema for `applications` and `applicationStatusEvents` tables.
- `convex/employerApplications.ts` – employer-facing queries that rely on the shared constants.
- `docs/GIGS_SCHEMA_REVIEW.md` – broader gig data model guidance.
