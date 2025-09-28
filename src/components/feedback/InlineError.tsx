"use client";

import { AlertCircle } from "lucide-react";
import type { ReactNode } from "react";

export interface InlineErrorProps {
  title?: string;
  description?: ReactNode;
  action?: ReactNode;
}

export function InlineError({ title, description, action }: InlineErrorProps) {
  return (
    <div className="border-destructive/40 bg-destructive/5 text-destructive flex items-start gap-3 rounded-xl border px-4 py-3 text-sm">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="space-y-1">
        {title ? <p className="font-medium">{title}</p> : null}
        {description ? <div className="text-destructive/80 text-sm leading-relaxed">{description}</div> : null}
        {action ? <div>{action}</div> : null}
      </div>
    </div>
  );
}
