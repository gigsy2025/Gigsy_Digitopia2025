"use client";

import { memo } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { GigListItem } from "@/types/gigs";
import { cn } from "@/lib/utils";

export type GigCardVariant = "default" | "compact";

export interface GigCardProps {
  gig: Pick<
    GigListItem,
    | "_id"
    | "title"
    | "category"
    | "budget"
    | "difficultyLevel"
    | "experienceRequired"
    | "skills"
    | "metadata"
    | "description"
  >;
  disabledActions?: boolean;
  showActions?: boolean;
  variant?: GigCardVariant;
  onApply?: (gigId: GigListItem["_id"]) => void;
  onSave?: (gigId: GigListItem["_id"]) => void;
  onSelect?: (gigId: GigListItem["_id"]) => void;
  className?: string;
}

function GigCardComponent({
  gig,
  variant = "default",
  showActions = true,
  disabledActions,
  onApply,
  onSave,
  onSelect,
  className,
}: GigCardProps) {
  const {
    _id,
    title,
    category,
    budget,
    difficultyLevel,
    experienceRequired,
    skills,
    metadata,
    description,
  } = gig;

  const handleApply = () => {
    if (disabledActions) return;
    onApply?.(_id);
  };

  const handleSave = () => {
    if (disabledActions) return;
    onSave?.(_id);
  };

  const handleSelect = () => {
    onSelect?.(_id);
  };

  return (
    <Card
      data-testid="gig-card"
      tabIndex={0}
      role="article"
      aria-labelledby={`gig-card-${_id}-title`}
      className={cn(
        "group focus-visible:border-primary flex h-full cursor-pointer flex-col justify-between transition-shadow hover:shadow-md",
        variant === "compact" && "gap-3 p-4",
        className,
      )}
      onClick={handleSelect}
      onKeyDown={(event) => {
        if (event.key === "Enter") {
          handleSelect();
        }
      }}
    >
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h3
              id={`gig-card-${_id}-title`}
              className="text-foreground group-hover:text-primary line-clamp-1 text-lg font-semibold transition-colors"
            >
              {title}
            </h3>
            <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
              <Badge variant="secondary" className="capitalize">
                {category}
              </Badge>
              <span className="inline-flex items-center gap-1">
                <Badge variant="outline" className="uppercase">
                  {budget.currency}
                </Badge>
                {Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: budget.currency,
                  minimumFractionDigits: 0,
                  maximumFractionDigits: 0,
                }).format(budget.min)}
                {budget.type !== "fixed" ? "/" + budget.type : null}
              </span>
              {budget.max !== budget.min && (
                <span className="text-muted-foreground text-xs">
                  up to{" "}
                  {Intl.NumberFormat(undefined, {
                    style: "currency",
                    currency: budget.currency,
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0,
                  }).format(budget.max)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-muted-foreground flex flex-wrap gap-2 text-xs">
          <Badge variant="outline" className="capitalize">
            {difficultyLevel}
          </Badge>
          <Badge variant="outline" className="capitalize">
            {experienceRequired} exp
          </Badge>
          {metadata?.isUrgent ? (
            <Badge variant="destructive">Urgent</Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="text-muted-foreground flex flex-1 flex-col gap-4 text-sm">
        <p className="text-foreground/80 line-clamp-3">{description}</p>
        <div className="flex flex-wrap gap-2">
          {skills.slice(0, 6).map((skill) => (
            <Badge
              key={skill}
              variant="outline"
              className="tracking-wide uppercase"
            >
              {skill}
            </Badge>
          ))}
          {skills.length > 6 ? (
            <span className="text-muted-foreground text-xs">
              +{skills.length - 6} more
            </span>
          ) : null}
        </div>
      </CardContent>
      {showActions ? (
        <CardFooter className="flex flex-wrap gap-2">
          <Button
            onClick={handleApply}
            disabled={disabledActions}
            className="grow sm:grow-0"
          >
            Apply
          </Button>
          <Button
            variant="ghost"
            onClick={handleSave}
            disabled={disabledActions}
          >
            Save
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}

export const GigCard = memo(GigCardComponent);
GigCard.displayName = "GigCard";
