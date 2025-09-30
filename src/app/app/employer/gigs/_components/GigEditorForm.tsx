"use client";

import { useMemo, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import type { Id } from "convex/_generated/dataModel";
import { useRouter } from "next/navigation";

import { Form } from "@/components/ui/form";
import type { EmployerGigDetail } from "@/utils/fetchers-server";
import {
  GigEditorSchema,
  type GigEditorFormValues,
  type GigEditorPayload,
} from "@/lib/validations/gigEditor";

export type { GigEditorPayload };

import { GigOverviewSection } from "./sections/GigOverviewSection";
import { GigBudgetTimelineSection } from "./sections/GigBudgetTimelineSection";
import { GigLocationVisibilitySection } from "./sections/GigLocationVisibilitySection";
import { GigPublishingControls } from "./sections/GigPublishingControls";
import { GigSnapshotCard } from "./sections/GigSnapshotCard";
import { deriveGigEditorDefaultValues } from "./utils/deriveGigEditorDefaults";
import { mapGigEditorValuesToPayload } from "./utils/mapGigEditorValuesToPayload";

export interface GigEditorFormProps {
  gig: EmployerGigDetail;
  onSubmit: (input: { gigId: Id<"gigs">; values: GigEditorPayload }) => Promise<{
    success: boolean;
    message?: string;
  }>;
}

export function GigEditorForm({ gig, onSubmit }: GigEditorFormProps) {
  const router = useRouter();
  const defaultValues = useMemo(() => deriveGigEditorDefaultValues(gig), [gig]);

  const form = useForm<GigEditorFormValues>({
    resolver: zodResolver(GigEditorSchema),
    defaultValues,
    mode: "onBlur",
  });

  const [isSaving, startSaving] = useTransition();

  const handleSubmit = (values: GigEditorFormValues) => {
    startSaving(() => {
      void (async () => {
        try {
          const payload = mapGigEditorValuesToPayload(values, gig);
          const result = await onSubmit({ gigId: gig._id, values: payload });

          if (result.success) {
            toast.success(result.message ?? "Gig updated successfully");
            router.push(`/app/employer/gigs/${gig._id}`);
          } else {
            toast.error(result.message ?? "Failed to update gig");
          }
        } catch (error) {
          console.error("Failed to update gig", error);
          toast.error("Unexpected error while updating gig");
        }
      })();
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr,1fr]"
      >
        <div className="space-y-6">
          <GigOverviewSection />
          <GigBudgetTimelineSection />
          <GigLocationVisibilitySection />
        </div>

        <aside className="space-y-6">
          <GigPublishingControls isSaving={isSaving} />
          <GigSnapshotCard gig={gig} />
        </aside>
      </form>
    </Form>
  );
}
