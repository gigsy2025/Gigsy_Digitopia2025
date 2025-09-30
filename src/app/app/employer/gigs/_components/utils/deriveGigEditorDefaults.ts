import type { GigEditorFormValues } from "@/lib/validations/gigEditor";
import type { EmployerGigDetail } from "@/utils/fetchers-server";

const toDateInput = (timestamp?: number | null) => {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

export function deriveGigEditorDefaultValues(
  gig: EmployerGigDetail,
): GigEditorFormValues {
  return {
    title: gig.title,
    description: gig.description,
    category: gig.category,
    experienceRequired: gig.experienceRequired ?? "intermediate",
    difficultyLevel: gig.difficultyLevel ?? "intermediate",
    skills: gig.skills ?? [],
    budgetMin: gig.budget?.min ?? 0,
    budgetMax: gig.budget?.max ?? 0,
    budgetCurrency: gig.budget?.currency ?? "USD",
    budgetType: gig.budget?.type ?? "fixed",
    applicationDeadline: toDateInput(gig.applicationDeadline ?? undefined),
    projectDeadline: toDateInput(gig.deadline ?? undefined),
    locationType:
      gig.location?.type ?? (gig.metadata?.isRemoteOnly ? "remote" : "onsite"),
    locationCity: gig.location?.city ?? "",
    locationCountry: gig.location?.country ?? "",
    isRemoteOnly: gig.metadata?.isRemoteOnly ?? gig.location?.type === "remote",
    isUrgent: gig.metadata?.isUrgent ?? false,
    estimatedDurationValue: gig.estimatedDuration?.value,
    estimatedDurationUnit: gig.estimatedDuration?.unit,
  } satisfies GigEditorFormValues;
}
