import { formatDistanceToNow } from "date-fns";
import { ExternalLinkIcon, Loader2, SparklesIcon } from "lucide-react";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Id } from "convex/_generated/dataModel";
import type {
  ApplicationStatus,
  ApplicationWithGig,
} from "@/types/applications";

interface ApplicationCardProps {
  item: ApplicationWithGig;
  onViewGig?: (gigId: string) => void;
  onWithdraw?: (applicationId: Id<"applications">) => void;
  disableActions?: boolean;
  isWithdrawing?: boolean;
  insight?: string | null;
  showInsightBadge?: boolean;
}

const STATUS_VARIANTS: Record<
  ApplicationStatus,
  "default" | "secondary" | "destructive"
> = {
  submitted: "secondary",
  in_review: "default",
  shortlisted: "default",
  rejected: "destructive",
  hired: "default",
  withdrawn: "secondary",
};

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  submitted: "Submitted",
  in_review: "In review",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  hired: "Hired",
  withdrawn: "Withdrawn",
};

function formatTimeline(timestamp: number) {
  return formatDistanceToNow(timestamp, { addSuffix: true });
}

export function ApplicationCard({
  item,
  onViewGig,
  onWithdraw,
  disableActions,
  isWithdrawing = false,
  insight,
  showInsightBadge = false,
}: ApplicationCardProps) {
  const { application, gig } = item;

  const employerNameFromGig =
    "employerName" in gig
      ? (gig as { employerName?: string }).employerName
      : undefined;

  const employerNameFromMetadata =
    gig.metadata &&
    typeof gig.metadata === "object" &&
    "employerName" in gig.metadata
      ? (gig.metadata as { employerName?: string }).employerName
      : undefined;

  const employerName = employerNameFromGig ?? employerNameFromMetadata;

  const appliedAt = formatTimeline(application._creationTime ?? Date.now());
  const statusLabel = STATUS_LABELS[application.status];
  const badgeVariant = STATUS_VARIANTS[application.status];

  const handleViewGig = () => {
    onViewGig?.(gig._id);
  };

  const handleWithdraw = () => {
    if (disableActions) return;
    onWithdraw?.(application._id);
  };

  return (
    <Card className="border-border/60 shadow-none transition-shadow hover:shadow-md">
      <CardHeader className="gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-foreground text-lg">{gig.title}</CardTitle>
          <Badge variant={badgeVariant}>{statusLabel}</Badge>
          {showInsightBadge && insight ? (
            <Badge variant="outline" className="gap-1 text-xs">
              <SparklesIcon className="size-3" />
              Insight
            </Badge>
          ) : null}
        </div>
        <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
          <span>Applied {appliedAt}</span>
          {gig.metadata?.applicantCount ? (
            <span>{gig.metadata.applicantCount} total applicants</span>
          ) : null}
        </div>
        {insight && <p className="text-muted-foreground text-sm">{insight}</p>}
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
          <div>
            <p className="text-muted-foreground">Employer</p>
            <p className="text-foreground font-medium">
              {employerName ?? "Confidential"}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Budget</p>
            <p className="text-foreground font-medium">
              {gig.budget.min.toLocaleString()} -{" "}
              {gig.budget.max.toLocaleString()} {gig.budget.currency}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Deadline</p>
            <p className="text-foreground font-medium">
              {gig.deadline ? formatTimeline(gig.deadline) : "Flexible"}
            </p>
          </div>
        </div>
        {application.coverLetter ? (
          <div className="bg-muted text-muted-foreground rounded-md p-4 text-sm">
            <p className="text-foreground font-semibold">Cover letter</p>
            <p className="mt-2 leading-relaxed whitespace-pre-line">
              {application.coverLetter}
            </p>
          </div>
        ) : null}
        {application.portfolioLinks?.length ? (
          <div className="flex flex-col gap-2">
            <p className="text-foreground text-sm font-semibold">
              Portfolio links
            </p>
            <ul className="flex flex-wrap gap-2">
              {application.portfolioLinks.map((link: string) => (
                <li key={link}>
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary inline-flex items-center gap-1 text-sm hover:underline"
                  >
                    {link}
                    <ExternalLinkIcon className="size-3.5" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-muted-foreground text-xs">
          Last updated {formatTimeline(application.updatedAt)}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={handleViewGig}>
            View gig
          </Button>
          {application.status !== "withdrawn" ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleWithdraw}
              disabled={disableActions}
            >
              {isWithdrawing ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  Withdrawing
                </span>
              ) : (
                "Withdraw"
              )}
            </Button>
          ) : null}
        </div>
      </CardFooter>
    </Card>
  );
}
