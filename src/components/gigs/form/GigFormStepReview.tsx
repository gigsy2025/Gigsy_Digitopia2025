"use client";

import { useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { formatDistanceToNow } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CreateGigInput } from "@/lib/validations/gigs";
import { cn } from "@/lib/utils";

function formatTimestamp(timestamp?: number) {
  if (!timestamp) {
    return "Not set";
  }
  try {
    return formatDistanceToNow(timestamp, { addSuffix: true });
  } catch (error) {
    console.warn("Unable to format timestamp", { timestamp, error });
    return "Invalid date";
  }
}

export function GigFormStepReview({ className }: { className?: string }) {
  const { getValues } = useFormContext<CreateGigInput>();
  const values = getValues();

  const metadataDetails = useMemo(
    () => [
      {
        label: "Urgency",
        value: values.metadata?.isUrgent ? "Urgent" : "Normal",
      },
      {
        label: "Remote only",
        value: values.metadata?.isRemoteOnly ? "Yes" : "No",
      },
      { label: "Views", value: values.metadata?.views ?? 0 },
      { label: "Saved", value: values.metadata?.savedCount ?? 0 },
      { label: "Applicants", value: values.metadata?.applicantCount ?? 0 },
      { label: "Version", value: values.metadata?.version ?? 1 },
      {
        label: "Last modified",
        value: formatTimestamp(values.metadata?.lastModified),
      },
      {
        label: "Featured until",
        value: formatTimestamp(values.metadata?.featuredUntil),
      },
      {
        label: "Published",
        value: formatTimestamp(values.metadata?.publishedAt),
      },
    ],
    [values.metadata],
  );

  const budgetSummary = useMemo(() => {
    const { min, max, currency, type } = values.budget;
    const formattedType = type.charAt(0).toUpperCase() + type.slice(1);

    if (min === max) {
      return `${min} ${currency} (${formattedType})`;
    }

    return `${min} - ${max} ${currency} (${formattedType})`;
  }, [values.budget]);

  const hasDeadlineInfo = values.deadline ?? values.applicationDeadline;

  return (
    <div className={cn("grid gap-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle>General information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <h3 className="text-foreground text-lg font-semibold">
              {values.title}
            </h3>
            <p className="text-muted-foreground text-sm">
              {values.description}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="capitalize">
              {values.category}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {values.difficultyLevel}
            </Badge>
            <Badge variant="outline" className="capitalize">
              {values.experienceRequired}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget & timeline</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div>
            <p className="text-muted-foreground text-sm font-medium">Budget</p>
            <p className="text-foreground text-lg font-semibold">
              {budgetSummary}
            </p>
          </div>

          {hasDeadlineInfo ? (
            <div className="text-muted-foreground grid gap-2 text-sm">
              {values.deadline ? (
                <p>Project deadline: {formatTimestamp(values.deadline)}</p>
              ) : null}
              {values.applicationDeadline ? (
                <p>
                  Application deadline:{" "}
                  {formatTimestamp(values.applicationDeadline)}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No deadlines specified.
            </p>
          )}

          {values.estimatedDuration ? (
            <p className="text-muted-foreground text-sm">
              Estimated duration: {values.estimatedDuration.value}{" "}
              {values.estimatedDuration.unit}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Required skills & experience</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            {values.skills.map((skill) => (
              <Badge key={skill} variant="secondary">
                {skill}
              </Badge>
            ))}
          </div>

          <Separator />

          <div className="text-muted-foreground grid gap-3 text-sm">
            {metadataDetails.map((detail) => (
              <div
                key={detail.label}
                className="flex items-center justify-between"
              >
                <span>{detail.label}</span>
                <span className="text-foreground font-medium">
                  {detail.value}
                </span>
              </div>
            ))}
          </div>

          {values.location ? (
            <div className="text-muted-foreground grid gap-2 text-sm">
              <Separator />
              <p className="text-foreground font-medium">Location details</p>
              <p>Type: {values.location.type}</p>
              {values.location.city ? (
                <p>City: {values.location.city}</p>
              ) : null}
              {values.location.country ? (
                <p>Country: {values.location.country}</p>
              ) : null}
              {values.location.timezone ? (
                <p>Timezone: {values.location.timezone}</p>
              ) : null}
            </div>
          ) : null}

          <Separator />

          <div className="flex justify-end">
            <Button type="submit">Publish gig</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
