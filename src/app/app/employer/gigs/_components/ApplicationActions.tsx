"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import type { ApplicationStatus } from "@/types/applications";
import { api } from "convex/_generated/api";
import type { Id } from "convex/_generated/dataModel";

interface ApplicationActionsProps {
  applicationId: Id<"applications">;
  currentStatus: ApplicationStatus;
}

const STATUS_OPTIONS: ReadonlyArray<{
  value: ApplicationStatus;
  label: string;
}> = [
  { value: "submitted", label: "Submitted" },
  { value: "in_review", label: "In review" },
  { value: "shortlisted", label: "Shortlisted" },
  { value: "rejected", label: "Rejected" },
  { value: "hired", label: "Hired" },
  { value: "withdrawn", label: "Withdrawn" },
] as const;

export function ApplicationActions({
  applicationId,
  currentStatus,
}: ApplicationActionsProps) {
  const router = useRouter();
  const toast = useToast();
  const updateStatus = useMutation(api.employerGigs.updateApplicationStatus);

  const [value, setValue] = useState<ApplicationStatus>(currentStatus);
  const [isPending, startTransition] = useTransition();

  const handleChange = useCallback(
    (nextValue: ApplicationStatus) => {
      if (nextValue === value) {
        return;
      }

      const previousValue = value;
      setValue(nextValue);

      startTransition(async () => {
        try {
          await updateStatus({
            applicationId,
            status: nextValue,
          });

          toast.success(`Application marked as ${formatStatus(nextValue)}.`);

          router.refresh();
        } catch (error) {
          console.error("Failed to update application status", error);
          setValue(previousValue);
          toast.error(
            error instanceof Error
              ? error.message
              : "Failed to update. Please try again.",
          );
        }
      });
    },
    [applicationId, router, toast, updateStatus, value],
  );

  return (
    <Select
      value={value}
      onValueChange={(next) => handleChange(next as ApplicationStatus)}
      disabled={isPending}
    >
      <SelectTrigger className="w-36">
        <SelectValue placeholder="Select status" />
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function formatStatus(status: ApplicationStatus): string {
  return status.replaceAll("_", " ");
}
