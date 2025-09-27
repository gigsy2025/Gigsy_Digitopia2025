"use client";

import { useCallback, useMemo, useState, type ComponentType } from "react";
import {
  FormProvider,
  useForm,
  type FieldPath,
  type Resolver,
  type SubmitHandler,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";

import { GigFormStepBudget } from "./GigFormStepBudget";
import { GigFormStepGeneral } from "./GigFormStepGeneral";
import { GigFormStepRequirements } from "./GigFormStepRequirements";
import { GigFormStepReview } from "./GigFormStepReview";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreateGigSchema } from "@/lib/validations/gigs";
import type { CreateGigInput } from "@/lib/validations/gigs";
import { cn } from "@/lib/utils";

type StepComponentProps = { className?: string };

type StepConfig = {
  id: "general" | "budget" | "requirements" | "review";
  title: string;
  description: string;
  component: ComponentType<StepComponentProps>;
  fields: FieldPath<CreateGigInput>[];
};

const STEP_DEFINITIONS: StepConfig[] = [
  {
    id: "general",
    title: "General information",
    description: "Provide high-level information about the gig.",
    component: GigFormStepGeneral,
    fields: ["title", "description", "category", "difficultyLevel"],
  },
  {
    id: "budget",
    title: "Budget & timeline",
    description: "Outline budget expectations and important dates.",
    component: GigFormStepBudget,
    fields: [
      "budget.min",
      "budget.max",
      "budget.currency",
      "budget.type",
      "deadline",
      "applicationDeadline",
    ],
  },
  {
    id: "requirements",
    title: "Requirements",
    description: "Describe the required skills and experience.",
    component: GigFormStepRequirements,
    fields: ["skills", "experienceRequired"],
  },
  {
    id: "review",
    title: "Review & submit",
    description: "Validate the gig information before publishing.",
    component: GigFormStepReview,
    fields: [],
  },
];

type GigMetadata = NonNullable<CreateGigInput["metadata"]>;

const DEFAULT_METADATA: Readonly<GigMetadata> = Object.freeze({
  views: 0,
  applicantCount: 0,
  savedCount: 0,
  lastModified: Date.now(),
  version: 1,
  isUrgent: false,
  isRemoteOnly: true,
});

const DEFAULT_VALUES: CreateGigInput = {
  title: "",
  description: "",
  category: "development",
  difficultyLevel: "intermediate",
  skills: [],
  experienceRequired: "intermediate",
  budget: {
    min: 500,
    max: 1500,
    currency: "USD",
    type: "fixed",
  },
  metadata: DEFAULT_METADATA,
};

export interface GigFormContainerProps {
  employerId: string;
  defaultValuesOverride?: Partial<CreateGigInput>;
  onSubmit?: (input: CreateGigInput) => Promise<void> | void;
  className?: string;
}

export function GigFormContainer({
  employerId,
  defaultValuesOverride,
  onSubmit,
  className,
}: GigFormContainerProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialValues = useMemo<CreateGigInput>(() => {
    const override = defaultValuesOverride ?? {};
    const metadataOverride = (override.metadata ?? {}) as Partial<GigMetadata>;

    const mergedMetadata: GigMetadata = {
      ...DEFAULT_METADATA,
      ...metadataOverride,
      lastModified: metadataOverride?.lastModified ?? Date.now(),
      version: metadataOverride?.version ?? DEFAULT_METADATA.version,
      views: metadataOverride?.views ?? DEFAULT_METADATA.views,
      applicantCount:
        metadataOverride?.applicantCount ?? DEFAULT_METADATA.applicantCount,
      savedCount: metadataOverride?.savedCount ?? DEFAULT_METADATA.savedCount,
      isUrgent: metadataOverride?.isUrgent ?? DEFAULT_METADATA.isUrgent,
      isRemoteOnly:
        metadataOverride?.isRemoteOnly ?? DEFAULT_METADATA.isRemoteOnly,
      featuredUntil: metadataOverride?.featuredUntil,
      publishedAt: metadataOverride?.publishedAt,
    } satisfies GigMetadata;

    const { metadata: _metadata, ...restOverrides } = override;

    return {
      ...DEFAULT_VALUES,
      ...restOverrides,
      metadata: mergedMetadata,
    } satisfies CreateGigInput;
  }, [defaultValuesOverride]);

  const form = useForm<CreateGigInput>({
    resolver: zodResolver(CreateGigSchema) as Resolver<CreateGigInput>,
    mode: "onBlur",
    defaultValues: initialValues,
  });

  const safeIndex = Math.min(
    Math.max(currentStepIndex, 0),
    STEP_DEFINITIONS.length - 1,
  );
  const activeStep = (STEP_DEFINITIONS[safeIndex] ?? STEP_DEFINITIONS[0])!;

  const isLastStep = safeIndex === STEP_DEFINITIONS.length - 1;

  const goToStep = useCallback(
    async (targetIndex: number) => {
      const clampedTarget = Math.min(
        Math.max(targetIndex, 0),
        STEP_DEFINITIONS.length - 1,
      );
      if (clampedTarget === safeIndex) {
        return;
      }

      const movingForward = clampedTarget > safeIndex;
      if (movingForward && activeStep.fields.length > 0) {
        const valid = await form.trigger(activeStep.fields);
        if (!valid) {
          return;
        }
      }

      setCurrentStepIndex(clampedTarget);
    },
    [activeStep.fields, form, safeIndex],
  );

  const handleNext = useCallback(async () => {
    await goToStep(safeIndex + 1);
  }, [goToStep, safeIndex]);

  const handleBack = useCallback(async () => {
    await goToStep(safeIndex - 1);
  }, [goToStep, safeIndex]);

  const handleValidSubmit: SubmitHandler<CreateGigInput> = useCallback(
    async (values) => {
      setIsSubmitting(true);
      try {
        await onSubmit?.(values);
        console.info("Gig submission payload", { employerId, values });
      } finally {
        setIsSubmitting(false);
      }
    },
    [employerId, onSubmit],
  );

  const StepComponent = activeStep.component;

  return (
    <FormProvider {...form}>
      <form
        onSubmit={form.handleSubmit(handleValidSubmit)}
        className={cn("space-y-8", className)}
      >
        <header className="space-y-6">
          <div>
            <h1 className="text-foreground text-2xl font-semibold">
              Create a new gig
            </h1>
            <p className="text-muted-foreground text-sm">
              Capture detailed gig requirements to help candidates understand
              expectations. You can update this information later.
            </p>
          </div>

          <nav
            aria-label="Gig form steps"
            className="grid gap-2 sm:grid-cols-4"
          >
            {STEP_DEFINITIONS.map((step, index) => {
              const isActive = index === safeIndex;
              const isCompleted = index < safeIndex;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => void goToStep(index)}
                  className={cn(
                    "rounded-lg border p-3 text-left transition-colors",
                    isActive && "border-primary bg-primary/5 text-primary",
                    isCompleted &&
                      !isActive &&
                      "border-muted-foreground/40 bg-muted",
                    !isActive && !isCompleted && "border-border",
                  )}
                >
                  <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                    Step {index + 1}
                  </p>
                  <p className="text-foreground text-sm font-semibold">
                    {step.title}
                  </p>
                  <p className="text-muted-foreground mt-1 line-clamp-2 text-xs">
                    {step.description}
                  </p>
                </button>
              );
            })}
          </nav>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>{activeStep.title}</CardTitle>
            <p className="text-muted-foreground text-sm">
              {activeStep.description}
            </p>
          </CardHeader>
          <Separator />
          <CardContent className="py-6">
            <StepComponent />
          </CardContent>
          <Separator />
          <CardFooter className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={safeIndex === 0 || isSubmitting}
            >
              Back
            </Button>
            {isLastStep ? (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 size-4 animate-spin" />
                    Publishing...
                  </>
                ) : (
                  "Publish gig"
                )}
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
              >
                Continue
              </Button>
            )}
          </CardFooter>
        </Card>
      </form>
    </FormProvider>
  );
}
