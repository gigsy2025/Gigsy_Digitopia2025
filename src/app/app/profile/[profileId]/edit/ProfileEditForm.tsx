"use client";

import { useEffect, useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

import {
  CONTRACT_TYPES,
  EXPERIENCE_LEVELS,
  VISIBILITY_LEVELS,
  type ContractType,
  type ExperienceLevel,
  type Visibility,
  type ProfileUpdateInput,
} from "../../../../../../shared/profile/profileCreationSchema";
import { submitProfileUpdate } from "./actions";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import type { ProfileViewModel } from "@/services/profile";
import type { UserProfile } from "@/types/auth";
import { useFormLogger } from "@/lib/logging/hooks";

const FormSchema = z
  .object({
    headline: z
      .string()
      .max(120, "Headline must be 120 characters or fewer")
      .optional(),
    bio: z.string().max(500, "Bio must be 500 characters or fewer").optional(),
    experienceLevel: z.enum(EXPERIENCE_LEVELS).optional(),
    visibility: z.enum(VISIBILITY_LEVELS).optional(),
    skillsInput: z
      .string()
      .max(500, "Skills input must be 500 characters or fewer")
      .optional(),
    hoursPerWeek: z.string().optional(),
    contractType: z.enum(CONTRACT_TYPES).optional(),
    availableFrom: z.string().optional(),
    country: z
      .string()
      .max(100, "Country must be 100 characters or fewer")
      .optional(),
    city: z
      .string()
      .max(100, "City must be 100 characters or fewer")
      .optional(),
    timezone: z
      .string()
      .max(100, "Timezone must be 100 characters or fewer")
      .optional(),
    contactEmail: z
      .string()
      .email("Contact email must be a valid email address")
      .optional(),
  })
  .superRefine((data, ctx) => {
    const trimmedHeadline = data.headline?.trim() ?? "";
    if (trimmedHeadline && trimmedHeadline.length < 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["headline"],
        message: "Headline must be at least 3 characters",
      });
    }

    const trimmedBio = data.bio?.trim() ?? "";
    if (trimmedBio && trimmedBio.length < 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["bio"],
        message: "Bio must be at least 20 characters",
      });
    }

    if (data.hoursPerWeek) {
      const asNumber = Number(data.hoursPerWeek);
      if (!Number.isFinite(asNumber) || asNumber < 1 || asNumber > 80) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["hoursPerWeek"],
          message: "Hours per week must be between 1 and 80",
        });
      }

      if (!data.contractType) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["contractType"],
          message: "Select a contract type when specifying hours per week",
        });
      }
    }

    if (data.contractType && !data.hoursPerWeek) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hoursPerWeek"],
        message: "Provide hours per week when selecting a contract type",
      });
    }

    if (data.availableFrom) {
      const parsed = Date.parse(data.availableFrom);
      if (!Number.isFinite(parsed)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["availableFrom"],
          message: "Available from must be a valid date",
        });
      }
    }
  });

export type ProfileEditFormValues = z.infer<typeof FormSchema>;

interface ProfileEditFormProps {
  profile: ProfileViewModel;
  currentUser: UserProfile;
}

function normalizeSkills(input?: string) {
  if (!input) return [] as string[];
  return Array.from(
    new Set(
      input
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean),
    ),
  );
}

function toIsoDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toISOString().slice(0, 10);
}

export function ProfileEditForm({
  profile,
  currentUser,
}: ProfileEditFormProps) {
  const { success, error, info } = useToast();
  const { logFormStart, logFormSubmit, logFormFieldInteraction } =
    useFormLogger("profile-edit", "profile-management");

  const initialSkills = useMemo(
    () => profile.skills.map((skill) => skill.name).filter(Boolean),
    [profile.skills],
  );

  const initialAvailability = useMemo(() => {
    if (!profile.summary.availability) return undefined;
    const { hoursPerWeek, contractType, availableFrom } =
      profile.summary.availability;
    return {
      hoursPerWeek,
      contractType,
      availableFrom: toIsoDate(availableFrom),
    };
  }, [profile.summary.availability]);

  const initialLocation = useMemo(() => {
    const location = profile.summary.location ?? {};
    return {
      country: location.country ?? "",
      city: location.city ?? "",
      timezone: location.timezone ?? "",
    };
  }, [profile.summary.location]);

  const initialValues = useMemo<ProfileEditFormValues>(() => {
    return {
      headline: profile.summary.headline ?? "",
      bio: profile.about?.bio ?? "",
      experienceLevel: profile.summary.experienceLevel ?? "intermediate",
      visibility: profile.summary.visibility ?? "platform",
      skillsInput: initialSkills.join(", "),
      hoursPerWeek:
        initialAvailability?.hoursPerWeek !== undefined
          ? String(initialAvailability.hoursPerWeek)
          : "",
      contractType: initialAvailability?.contractType,
      availableFrom: initialAvailability?.availableFrom ?? "",
      country: initialLocation.country,
      city: initialLocation.city,
      timezone: initialLocation.timezone,
      contactEmail: profile.sidebar.contactEmail ?? currentUser.email ?? "",
    };
  }, [
    currentUser.email,
    initialAvailability,
    initialLocation.city,
    initialLocation.country,
    initialLocation.timezone,
    initialSkills,
    profile.about?.bio,
    profile.sidebar.contactEmail,
    profile.summary.experienceLevel,
    profile.summary.headline,
    profile.summary.visibility,
  ]);

  const [isPending, startTransition] = useTransition();

  const form = useForm<ProfileEditFormValues>({
    resolver: zodResolver(FormSchema),
    mode: "onBlur",
    defaultValues: initialValues,
  });

  useEffect(() => {
    void logFormStart();
  }, [logFormStart]);

  const handleSubmit = form.handleSubmit((values) => {
    const payload: ProfileUpdateInput = {};

    const trimmedHeadline = values.headline?.trim() ?? "";
    if (trimmedHeadline !== (initialValues.headline?.trim() ?? "")) {
      payload.headline = trimmedHeadline.length > 0 ? trimmedHeadline : null;
    }

    const trimmedBio = values.bio?.trim() ?? "";
    if (trimmedBio !== (initialValues.bio?.trim() ?? "")) {
      payload.bio = trimmedBio.length > 0 ? trimmedBio : null;
    }

    if (
      values.experienceLevel &&
      values.experienceLevel !== initialValues.experienceLevel
    ) {
      payload.experienceLevel = values.experienceLevel;
    }

    if (values.visibility && values.visibility !== initialValues.visibility) {
      payload.visibility = values.visibility;
    }

    const normalizedSkillsInput = normalizeSkills(values.skillsInput);
    const initialSkillsNormalized = normalizeSkills(initialValues.skillsInput);
    const skillsChanged =
      normalizedSkillsInput.length !== initialSkillsNormalized.length ||
      normalizedSkillsInput.some(
        (skill, index) => skill !== initialSkillsNormalized[index],
      );

    if (skillsChanged) {
      payload.skills = normalizedSkillsInput.length
        ? normalizedSkillsInput
        : null;
    }

    const hoursPerWeekNumber = values.hoursPerWeek
      ? Number(values.hoursPerWeek)
      : undefined;
    const availability =
      hoursPerWeekNumber && values.contractType
        ? {
            hoursPerWeek: hoursPerWeekNumber,
            contractType: values.contractType,
            availableFrom: values.availableFrom
              ? new Date(values.availableFrom).toISOString()
              : undefined,
          }
        : undefined;

    const initialAvailabilityComparable = initialAvailability
      ? {
          hoursPerWeek: initialAvailability.hoursPerWeek,
          contractType: initialAvailability.contractType,
          availableFrom: initialAvailability.availableFrom
            ? new Date(initialAvailability.availableFrom).toISOString()
            : undefined,
        }
      : undefined;

    if (availability || initialAvailabilityComparable) {
      const availabilityChanged =
        JSON.stringify(availability) !==
        JSON.stringify(initialAvailabilityComparable);

      if (availabilityChanged) {
        payload.availability = availability ?? null;
      }
    }

    const location =
      values.country || values.city || values.timezone
        ? {
            country: values.country?.trim() ?? undefined,
            city: values.city?.trim() ?? undefined,
            timezone: values.timezone?.trim() ?? undefined,
          }
        : undefined;

    const initialLocationComparable =
      initialLocation.country ||
      initialLocation.city ||
      initialLocation.timezone
        ? {
            country: initialLocation.country.trim() || undefined,
            city: initialLocation.city.trim() || undefined,
            timezone: initialLocation.timezone.trim() || undefined,
          }
        : undefined;

    if (location || initialLocationComparable) {
      const locationChanged =
        JSON.stringify(location) !== JSON.stringify(initialLocationComparable);

      if (locationChanged) {
        payload.location = location ?? null;
      }
    }

    const trimmedEmail = values.contactEmail?.trim() ?? "";
    if (trimmedEmail !== (initialValues.contactEmail?.trim() ?? "")) {
      payload.contactEmail = trimmedEmail.length
        ? trimmedEmail.toLowerCase()
        : null;
    }

    if (Object.keys(payload).length === 0) {
      info("No changes detected – update a field before saving.");
      void logFormSubmit(false, new Error("no-changes"), {});
      return;
    }

    startTransition(async () => {
      try {
        const result = await submitProfileUpdate({
          profileSlug: profile.summary.slug,
          profileRecordId: profile.summary.profileRecordId,
          input: payload,
        });

        if (!result.success) {
          if (result.fieldErrors) {
            for (const [field, messages] of Object.entries(
              result.fieldErrors,
            )) {
              if (messages?.length) {
                const message = messages[0];
                form.setError(field as keyof ProfileEditFormValues, {
                  type: "server",
                  message,
                });
              }
            }
          }

          error(result.message ?? "Failed to update profile.");
          await logFormSubmit(
            false,
            new Error(result.message ?? "profile-update-error"),
            payload,
          );
          return;
        }

        success("Profile updated successfully.");
        form.reset(values, { keepValues: true });
        await logFormSubmit(true, undefined, payload);
      } catch (submissionError) {
        console.error(
          "[ProfileEditForm] Failed to submit update",
          submissionError,
        );
        error("Something went wrong while updating your profile.");
        await logFormSubmit(
          false,
          submissionError instanceof Error
            ? submissionError
            : new Error("profile-update-exception"),
          payload,
        );
      }
    });
  });

  const handleFieldBlur = (
    fieldName: keyof ProfileEditFormValues,
    handler?: () => void,
  ) => {
    return () => {
      handler?.();
      void logFormFieldInteraction(fieldName as string, "blur");
    };
  };

  const handleFieldChange = (
    fieldName: keyof ProfileEditFormValues,
    handler?: (value: unknown) => void,
  ) => {
    return (value: unknown) => {
      handler?.(value);
      void logFormFieldInteraction(fieldName as string, "change");
    };
  };

  const renderAvailabilityHelper = () => {
    if (!form.watch("hoursPerWeek")) {
      return "Share your weekly availability to help clients plan engagements.";
    }

    return "Specify a contract type and optional start date to clarify availability.";
  };

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <p className="text-muted-foreground text-sm">Profile management</p>
        <h1 className="text-3xl font-semibold">
          Edit profile for {profile.summary.fullName}
        </h1>
        <p className="text-muted-foreground text-sm">
          Last updated:
          {profile.summary.stats?.lastUpdated
            ? ` ${new Date(profile.summary.stats.lastUpdated).toLocaleString()}`
            : " Not available"}
        </p>
      </header>

      <Form {...form}>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-10"
          noValidate
        >
          <section className="bg-card rounded-lg border p-6 shadow-sm">
            <div className="flex flex-col gap-1 pb-4">
              <h2 className="text-xl font-semibold">Professional summary</h2>
              <p className="text-muted-foreground text-sm">
                Update your public headline and bio so clients understand your
                value at a glance.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="headline"
                render={({ field }) => (
                  <FormItem>
                    <label className="text-sm font-medium" htmlFor="headline">
                      Headline
                    </label>
                    <FormControl>
                      <Input
                        id="headline"
                        placeholder="Senior Product Designer · AI Interfaces"
                        {...field}
                        onBlur={handleFieldBlur("headline", () =>
                          field.onBlur(),
                        )}
                      />
                    </FormControl>
                    <FormDescription>
                      Keep it concise – aim for job title + specialty.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experienceLevel"
                render={({ field }) => (
                  <FormItem>
                    <label
                      className="text-sm font-medium"
                      htmlFor="experienceLevel"
                    >
                      Experience level
                    </label>
                    <FormControl>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(value) =>
                          handleFieldChange(
                            "experienceLevel",
                            field.onChange,
                          )(value as ExperienceLevel)
                        }
                      >
                        <SelectTrigger id="experienceLevel">
                          <SelectValue placeholder="Select experience level" />
                        </SelectTrigger>
                        <SelectContent>
                          {EXPERIENCE_LEVELS.map((level) => (
                            <SelectItem
                              key={level}
                              value={level}
                              className="capitalize"
                            >
                              {level}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem className="pt-4">
                  <label className="text-sm font-medium" htmlFor="bio">
                    About you
                  </label>
                  <FormControl>
                    <Textarea
                      id="bio"
                      className="min-h-[160px]"
                      placeholder="Tell clients about your strengths, notable projects, and how you work best."
                      {...field}
                      onBlur={handleFieldBlur("bio", () => field.onBlur())}
                    />
                  </FormControl>
                  <FormDescription>
                    Aim for 3-4 concise sentences covering expertise, outcomes,
                    and collaboration style.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 pt-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <label className="text-sm font-medium" htmlFor="visibility">
                      Profile visibility
                    </label>
                    <FormControl>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(value) =>
                          handleFieldChange(
                            "visibility",
                            field.onChange,
                          )(value as Visibility)
                        }
                      >
                        <SelectTrigger id="visibility">
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                        <SelectContent>
                          {VISIBILITY_LEVELS.map((visibility) => (
                            <SelectItem
                              key={visibility}
                              value={visibility}
                              className="capitalize"
                            >
                              {visibility === "platform"
                                ? "Platform only"
                                : visibility}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Control whether your profile is public or limited to Gigsy
                      members.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactEmail"
                render={({ field }) => (
                  <FormItem>
                    <label
                      className="text-sm font-medium"
                      htmlFor="contactEmail"
                    >
                      Contact email
                    </label>
                    <FormControl>
                      <Input
                        id="contactEmail"
                        type="email"
                        placeholder="you@gigsy.dev"
                        {...field}
                        onBlur={handleFieldBlur("contactEmail", () =>
                          field.onBlur(),
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <section className="bg-card rounded-lg border p-6 shadow-sm">
            <div className="flex flex-col gap-1 pb-4">
              <h2 className="text-xl font-semibold">Skills & expertise</h2>
              <p className="text-muted-foreground text-sm">
                Highlight the capabilities you want surfaced in search results.
              </p>
            </div>

            <FormField
              control={form.control}
              name="skillsInput"
              render={({ field }) => (
                <FormItem>
                  <label className="text-sm font-medium" htmlFor="skills">
                    Skills (comma separated)
                  </label>
                  <FormControl>
                    <Input
                      id="skills"
                      placeholder="Product strategy, React, Design systems"
                      {...field}
                      onBlur={handleFieldBlur("skillsInput", () =>
                        field.onBlur(),
                      )}
                    />
                  </FormControl>
                  <FormDescription>
                    Separate each skill with a comma. Duplicates are removed
                    automatically.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <section className="bg-card rounded-lg border p-6 shadow-sm">
            <div className="flex flex-col gap-1 pb-4">
              <h2 className="text-xl font-semibold">Availability</h2>
              <p className="text-muted-foreground text-sm">
                Share how you prefer to work.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="hoursPerWeek"
                render={({ field }) => (
                  <FormItem>
                    <label
                      className="text-sm font-medium"
                      htmlFor="hoursPerWeek"
                    >
                      Hours per week
                    </label>
                    <FormControl>
                      <Input
                        id="hoursPerWeek"
                        type="number"
                        min={1}
                        max={80}
                        placeholder="30"
                        {...field}
                        onBlur={handleFieldBlur("hoursPerWeek", () =>
                          field.onBlur(),
                        )}
                      />
                    </FormControl>
                    <FormDescription>
                      {renderAvailabilityHelper()}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contractType"
                render={({ field }) => (
                  <FormItem>
                    <label
                      className="text-sm font-medium"
                      htmlFor="contractType"
                    >
                      Contract type
                    </label>
                    <FormControl>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(value) =>
                          handleFieldChange(
                            "contractType",
                            field.onChange,
                          )(value as ContractType)
                        }
                      >
                        <SelectTrigger id="contractType">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {CONTRACT_TYPES.map((contract) => (
                            <SelectItem
                              key={contract}
                              value={contract}
                              className="capitalize"
                            >
                              {contract.replace("-", " ")}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="availableFrom"
                render={({ field }) => (
                  <FormItem>
                    <label
                      className="text-sm font-medium"
                      htmlFor="availableFrom"
                    >
                      Available from
                    </label>
                    <FormControl>
                      <Input
                        id="availableFrom"
                        type="date"
                        {...field}
                        onBlur={handleFieldBlur("availableFrom", () =>
                          field.onBlur(),
                        )}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional start date availability.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <section className="bg-card rounded-lg border p-6 shadow-sm">
            <div className="flex flex-col gap-1 pb-4">
              <h2 className="text-xl font-semibold">Location</h2>
              <p className="text-muted-foreground text-sm">
                Share your preferred location information to help with timezone
                alignment.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="country"
                render={({ field }) => (
                  <FormItem>
                    <label className="text-sm font-medium" htmlFor="country">
                      Country
                    </label>
                    <FormControl>
                      <Input
                        id="country"
                        placeholder="United States"
                        {...field}
                        onBlur={handleFieldBlur("country", () =>
                          field.onBlur(),
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <label className="text-sm font-medium" htmlFor="city">
                      City
                    </label>
                    <FormControl>
                      <Input
                        id="city"
                        placeholder="San Francisco"
                        {...field}
                        onBlur={handleFieldBlur("city", () => field.onBlur())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <label className="text-sm font-medium" htmlFor="timezone">
                      Timezone
                    </label>
                    <FormControl>
                      <Input
                        id="timezone"
                        placeholder="America/Los_Angeles"
                        {...field}
                        onBlur={handleFieldBlur("timezone", () =>
                          field.onBlur(),
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </section>

          <footer className="flex flex-col gap-3 pb-8 sm:flex-row sm:items-center">
            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isPending || !form.formState.isDirty}
              >
                {isPending ? "Saving..." : "Save changes"}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={isPending}
                onClick={() => {
                  form.reset(initialValues);
                }}
              >
                Reset
              </Button>
            </div>
            {!form.formState.isDirty && (
              <p className="text-muted-foreground text-sm">
                Make a change to enable saving.
              </p>
            )}
          </footer>
        </form>
      </Form>
    </div>
  );
}
