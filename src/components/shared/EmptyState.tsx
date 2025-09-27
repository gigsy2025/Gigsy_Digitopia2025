"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface EmptyStateProps {
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  icon,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "border-border bg-muted/40 flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-10 text-center",
        className,
      )}
    >
      {icon ? <div className="text-muted-foreground/80">{icon}</div> : null}
      <div className="space-y-2">
        <h3 className="text-foreground text-lg font-semibold">{title}</h3>
        {description ? (
          <p className="text-muted-foreground max-w-prose text-sm">
            {description}
          </p>
        ) : null}
      </div>
      {actionLabel ? (
        <Button onClick={onAction} variant="secondary">
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
