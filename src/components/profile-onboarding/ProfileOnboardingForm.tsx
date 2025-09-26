"use client";

import { useMemo, useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { submitProfileOnboarding } from "../../app/app/profile/[profileId]/actions";
import {
  CONTRACT_TYPES,
  EXPERIENCE_LEVELS,
  VISIBILITY_LEVELS,
  type ContractType,
  type ExperienceLevel,
  type Visibility,
} from "../../../shared/profile/profileCreationSchema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { UserProfile } from "@/types/auth";

const FormSchema = z.object({
  fullName: z.string().min(2, "Full name is required"),
  headline: z
    .string()
    .max(120, "Headline must be under 120 characters")
    .optional(),
  bio: z.string().max(500, "Bio must be under 500 characters").optional(),
  experienceLevel: z.enum(EXPERIENCE_LEVELS),
  visibility: z.enum(VISIBILITY_LEVELS),
  skillsInput: z
    .string()
    .max(500, "Skills must be under 500 characters")
    .optional(),
  hoursPerWeek: z
    .string()
    .optional()
    .refine(
      (value) =>
        !value || (!!Number(value) && Number(value) > 0 && Number(value) <= 80),
      "Hours per week must be between 1 and 80",
    ),
  contractType: z.enum(CONTRACT_TYPES).optional(),
  availableFrom: z.string().optional(),
  country: z
    .string()
    .max(100, "Country must be under 100 characters")
    .optional(),
  city: z.string().max(100, "City must be under 100 characters").optional(),
  timezone: z
    .string()
    .max(100, "Timezone must be under 100 characters")
    .optional(),
  websiteUrl: z.string().url("Website URL must be valid").optional(),
  githubUrl: z.string().url("GitHub URL must be valid").optional(),
  linkedinUrl: z.string().url("LinkedIn URL must be valid").optional(),
  contactEmail: z
    .string()
    .email("Please enter a valid email address")
    .optional(),
});

export type ProfileOnboardingFormValues = z.infer<typeof FormSchema>;

export interface ProfileOnboardingFormProps {
  currentUser: UserProfile;
  desiredSlug: string;
}

export function ProfileOnboardingForm({
  currentUser,
  desiredSlug,
}: ProfileOnboardingFormProps) {
  const [isPending, startTransition] = useTransition();
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const defaultFullName = useMemo(() => {
    if (currentUser.name) return currentUser.name;
    const parts = [currentUser.firstName, currentUser.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();
    return parts || "";
  }, [currentUser]);

  const form = useForm<ProfileOnboardingFormValues>({
    mode: "onBlur",
    defaultValues: {
      fullName: defaultFullName,
      headline: "",
      bio: "",
      experienceLevel: "intermediate",
      visibility: "platform",
      skillsInput: "",
      hoursPerWeek: "",
      contractType: undefined,
      availableFrom: "",
      country: "",
      city: "",
      timezone: "",
      websiteUrl: "",
      githubUrl: "",
      linkedinUrl: "",
      contactEmail: currentUser.email ?? "",
    },
  });

  const handleSubmit = form.handleSubmit((values) => {
    setSubmissionError(null);

    const normalizedSkills = values.skillsInput
      ? values.skillsInput
          .split(",")
          .map((skill) => skill.trim())
          .filter(Boolean)
      : [];

    if (values.hoursPerWeek && !values.contractType) {
      form.setError("contractType", {
        type: "manual",
        message: "Select a contract type when specifying hours per week",
      });
      return;
    }

    const hoursPerWeekNumber = values.hoursPerWeek
      ? Number(values.hoursPerWeek)
      : undefined;

    const availability =
      hoursPerWeekNumber && values.contractType
        ? {
            hoursPerWeek: hoursPerWeekNumber,
            contractType: values.contractType,
            availableFrom: values.availableFrom ?? undefined,
          }
        : undefined;

    const location =
      values.country || values.city || values.timezone
        ? {
            country: values.country ?? undefined,
            city: values.city ?? undefined,
            timezone: values.timezone ?? undefined,
          }
        : undefined;

    const social =
      values.websiteUrl || values.githubUrl || values.linkedinUrl
        ? {
            websiteUrl: values.websiteUrl ?? undefined,
            githubUrl: values.githubUrl ?? undefined,
            linkedinUrl: values.linkedinUrl ?? undefined,
          }
        : undefined;

    startTransition(async () => {
      try {
        await submitProfileOnboarding({
          slug: desiredSlug,
          fullName: values.fullName.trim(),
          headline: values.headline?.trim() ?? undefined,
          bio: values.bio?.trim() ?? undefined,
          experienceLevel: values.experienceLevel,
          visibility: values.visibility,
          skills: normalizedSkills,
          availability,
          location,
          social,
          contactEmail: values.contactEmail?.trim() ?? undefined,
        });
      } catch (error) {
        console.error("[ProfileOnboarding] Failed to submit profile", error);
        setSubmissionError(
          error instanceof Error
            ? error.message
            : "Something went wrong while creating your profile.",
        );
      }
    });
  });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 py-12">
      <header className="flex flex-col gap-2 text-center">
        <p className="text-primary text-sm tracking-wide uppercase">
          Create your profile
        </p>
        <h1 className="text-3xl font-semibold">
          Let&#39;s get your Gigsy presence started
        </h1>
        <p className="text-muted-foreground">
          Complete your professional profile so clients can discover you. You
          can update these details anytime.
        </p>
        <div className="bg-muted rounded-md border px-3 py-2 text-sm">
          <span className="font-medium">Profile URL:</span>{" "}
          <span className="text-primary font-mono">
            gigsy.dev/app/profile/{desiredSlug}
          </span>
        </div>
      </header>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <section className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="fullName">Full name</Label>
                  <FormControl>
                    <Input id="fullName" placeholder="Jane Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="headline"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="headline">Professional headline</Label>
                  <FormControl>
                    <Input
                      id="headline"
                      placeholder="Full-stack engineer · React & Node.js"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="bio">About you</Label>
                <FormControl>
                  <Textarea
                    id="bio"
                    placeholder="Share a short summary about your experience, focus areas, and what you bring to clients."
                    className="min-h-[120px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Tip: Highlight accomplishments, industries you serve, and your
                  working style.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <section className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="experienceLevel"
              render={({ field }) => (
                <FormItem>
                  <Label>Experience level</Label>
                  <FormControl>
                    <Select
                      disabled={isPending}
                      value={field.value}
                      onValueChange={(value) =>
                        field.onChange(value as ExperienceLevel)
                      }
                    >
                      <SelectTrigger>
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

            <FormField
              control={form.control}
              name="visibility"
              render={({ field }) => (
                <FormItem>
                  <Label>Profile visibility</Label>
                  <FormControl>
                    <Select
                      disabled={isPending}
                      value={field.value}
                      onValueChange={(value) =>
                        field.onChange(value as Visibility)
                      }
                    >
                      <SelectTrigger>
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
                    Public profiles are visible outside Gigsy. Platform-only
                    hides you from search engines.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <FormField
            control={form.control}
            name="skillsInput"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="skills">Core skills</Label>
                <FormControl>
                  <Input
                    id="skills"
                    placeholder="Design systems, React, Product strategy"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Separate each skill with a comma. Highlight the expertise you
                  want clients to know about.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <section className="grid gap-4 md:grid-cols-2">
            <FormField
              control={form.control}
              name="hoursPerWeek"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="hoursPerWeek">
                    Availability (hours per week)
                  </Label>
                  <FormControl>
                    <Input
                      id="hoursPerWeek"
                      type="number"
                      min={1}
                      max={80}
                      placeholder="30"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="contractType"
              render={({ field }) => (
                <FormItem>
                  <Label>Preferred engagement</Label>
                  <FormControl>
                    <Select
                      disabled={isPending}
                      value={field.value}
                      onValueChange={(value) =>
                        field.onChange(value as ContractType)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select engagement" />
                      </SelectTrigger>
                      <SelectContent>
                        {CONTRACT_TYPES.map((type) => (
                          <SelectItem
                            key={type}
                            value={type}
                            className="capitalize"
                          >
                            {type.replace("-", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="country">Country</Label>
                  <FormControl>
                    <Input id="country" placeholder="Egypt" {...field} />
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
                  <Label htmlFor="city">City</Label>
                  <FormControl>
                    <Input id="city" placeholder="Cairo" {...field} />
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
                  <Label htmlFor="timezone">Timezone</Label>
                  <FormControl>
                    <Input
                      id="timezone"
                      placeholder="Africa/Cairo"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            <FormField
              control={form.control}
              name="websiteUrl"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="websiteUrl">Website</Label>
                  <FormControl>
                    <Input
                      id="websiteUrl"
                      placeholder="https://portfolio.dev"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="githubUrl"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="githubUrl">GitHub</Label>
                  <FormControl>
                    <Input
                      id="githubUrl"
                      placeholder="https://github.com/username"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="linkedinUrl"
              render={({ field }) => (
                <FormItem>
                  <Label htmlFor="linkedinUrl">LinkedIn</Label>
                  <FormControl>
                    <Input
                      id="linkedinUrl"
                      placeholder="https://linkedin.com/in/username"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <Label htmlFor="contactEmail">Contact email</Label>
                <FormControl>
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="you@gigsy.dev"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {submissionError && (
            <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-md border px-4 py-3 text-sm">
              {submissionError}
            </div>
          )}

          <div className="flex flex-col items-center gap-3 md:flex-row md:justify-between">
            <p className="text-muted-foreground text-sm">
              You can enrich your profile later with portfolio projects,
              experience entries, and media.
            </p>
            <Button
              type="submit"
              size="lg"
              disabled={isPending}
              className={cn({ "opacity-80": isPending })}
            >
              {isPending ? "Creating profile..." : "Create my profile"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
