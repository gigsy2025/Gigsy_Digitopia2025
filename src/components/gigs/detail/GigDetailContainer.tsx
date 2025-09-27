"use client";

import { GigCard } from "@/components/gigs/list/GigCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { GigDetail, GigListItem } from "@/types/gigs";

export interface GigDetailContainerProps {
  gig: GigDetail;
  relatedGigs?: Array<
    Pick<
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
    >
  >;
  onApply?: (gigId: GigDetail["_id"]) => void;
  onSave?: (gigId: GigDetail["_id"]) => void;
}

export function GigDetailContainer({
  gig,
  relatedGigs,
  onApply,
  onSave,
}: GigDetailContainerProps) {
  const budgetFormatter = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: gig.budget.currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });

  return (
    <div className="space-y-8">
      <section className="border-border bg-card space-y-6 rounded-2xl border p-6 shadow-sm">
        <header className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-foreground text-2xl font-semibold">
                {gig.title}
              </h1>
              <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
                <Badge variant="secondary" className="capitalize">
                  {gig.category}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {gig.difficultyLevel}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {gig.experienceRequired} experience
                </Badge>
                {gig.metadata?.isUrgent ? (
                  <Badge variant="destructive">Urgent</Badge>
                ) : null}
                {gig.metadata?.isRemoteOnly ? (
                  <Badge variant="outline">Remote</Badge>
                ) : null}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-right">
                <p className="text-muted-foreground text-xs uppercase">
                  Budget
                </p>
                <p className="text-foreground text-lg font-semibold">
                  {budgetFormatter.format(gig.budget.min)} –{" "}
                  {budgetFormatter.format(gig.budget.max)} {gig.budget.type}
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => onApply?.(gig._id)}>Apply</Button>
                <Button variant="ghost" onClick={() => onSave?.(gig._id)}>
                  Save
                </Button>
              </div>
            </div>
          </div>
        </header>

        <Separator />

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <p>{gig.longDescription}</p>
        </article>

        <dl className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <dt className="text-foreground text-sm font-semibold">
              Responsibilities
            </dt>
            <dd className="space-y-2">
              {gig.responsibilities.map((responsibility) => (
                <p
                  key={responsibility}
                  className="text-muted-foreground text-sm"
                >
                  • {responsibility}
                </p>
              ))}
            </dd>
          </div>
          <div className="space-y-2">
            <dt className="text-foreground text-sm font-semibold">
              Requirements
            </dt>
            <dd className="space-y-2">
              {gig.requirements.map((requirement) => (
                <p key={requirement} className="text-muted-foreground text-sm">
                  • {requirement}
                </p>
              ))}
            </dd>
          </div>
        </dl>

        {gig.perks?.length ? (
          <div className="space-y-2">
            <h2 className="text-foreground text-sm font-semibold">Perks</h2>
            <div className="flex flex-wrap gap-2">
              {gig.perks.map((perk) => (
                <Badge key={perk} variant="outline">
                  {perk}
                </Badge>
              ))}
            </div>
          </div>
        ) : null}

        <div className="space-y-2">
          <h2 className="text-foreground text-sm font-semibold">Skills</h2>
          <div className="flex flex-wrap gap-2">
            {gig.skills.map((skill) => (
              <Badge
                key={skill}
                variant="outline"
                className="tracking-wide uppercase"
              >
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        {gig.location ? (
          <Card className="border-dashed">
            <CardHeader>
              <h3 className="text-foreground text-sm font-semibold">
                Location & Collaboration
              </h3>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              <p className="capitalize">{gig.location.type}</p>
              {gig.location.city ? (
                <p>
                  {gig.location.city}
                  {gig.location.country ? `, ${gig.location.country}` : ""}
                </p>
              ) : null}
              {gig.location.timezone ? (
                <p>Timezone: {gig.location.timezone}</p>
              ) : null}
            </CardContent>
          </Card>
        ) : null}
      </section>

      {relatedGigs?.length ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-foreground text-lg font-semibold">
              Recommended gigs
            </h2>
            <Button variant="ghost" size="sm">
              View all
            </Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {relatedGigs.map((relatedGig) => (
              <GigCard
                key={relatedGig._id}
                gig={relatedGig}
                showActions={false}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
