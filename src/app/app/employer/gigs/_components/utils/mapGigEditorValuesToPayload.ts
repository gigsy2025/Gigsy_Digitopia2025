import type { GigEditorFormValues, GigEditorPayload } from "@/lib/validations/gigEditor";
import type { EmployerGigDetail } from "@/utils/fetchers-server";

const toTimestamp = (value?: string) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
};

export function mapGigEditorValuesToPayload(
  values: GigEditorFormValues,
  gig: EmployerGigDetail,
): GigEditorPayload {
  const estimatedDuration = values.estimatedDurationValue
    ? {
        value: values.estimatedDurationValue,
        unit: values.estimatedDurationUnit ?? "weeks",
      }
    : null;

  const locationType = values.locationType;
  const location =
    locationType === "remote"
      ? { type: locationType }
      : {
          type: locationType,
          city: values.locationCity?.trim() || undefined,
          country: values.locationCountry?.trim() || undefined,
        };

  return {
    title: values.title,
    description: values.description,
    category: values.category,
    experienceRequired: values.experienceRequired,
    difficultyLevel: values.difficultyLevel,
    skills: values.skills,
    budget: {
      min: values.budgetMin,
      max: values.budgetMax,
      currency: values.budgetCurrency,
      type: values.budgetType,
    },
    applicationDeadline: toTimestamp(values.applicationDeadline),
    deadline: toTimestamp(values.projectDeadline),
    estimatedDuration,
    location,
    metadata: {
      isRemoteOnly: values.isRemoteOnly,
      isUrgent: values.isUrgent,
    },
    expectedVersion: gig.metadata?.version,
  } satisfies GigEditorPayload;
}
