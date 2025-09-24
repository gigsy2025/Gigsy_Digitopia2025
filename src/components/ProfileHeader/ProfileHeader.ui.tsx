"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { ProfileHeaderProps } from "./types";

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("")
    .padEnd(2, "·");
}

export type ProfileHeaderUIProps = ProfileHeaderProps;

export function ProfileHeaderUI({ summary }: ProfileHeaderUIProps) {
  const initials = getInitials(summary.fullName);

  return (
    <Card className="relative overflow-hidden border-none bg-transparent">
      <div className="bg-muted relative h-48 w-full overflow-hidden rounded-2xl md:h-60">
        {summary.coverImageUrl ? (
          <Image
            src={summary.coverImageUrl}
            alt={`${summary.fullName} cover image`}
            fill
            priority
            className="object-cover"
          />
        ) : null}
        <div className="from-background/90 via-background/60 to-background/10 absolute inset-0 bg-gradient-to-t" />
      </div>

      <div className="px-4 pb-4 sm:px-6 sm:pb-6">
        <div className="relative z-10 -mt-16 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-1 flex-col gap-4 sm:flex-row sm:items-end">
            <Avatar className="ring-background h-28 w-28 ring-4">
              {summary.avatarUrl ? (
                <AvatarImage src={summary.avatarUrl} alt={summary.fullName} />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>

            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
                  {summary.fullName || summary.slug}
                </h1>
                {summary.experienceLevel ? (
                  <Badge variant="secondary" className="uppercase">
                    {summary.experienceLevel}
                  </Badge>
                ) : null}
              </div>

              {summary.headline ? (
                <p className="text-muted-foreground max-w-2xl text-base">
                  {summary.headline}
                </p>
              ) : null}

              <div className="text-muted-foreground flex flex-wrap gap-3 text-sm">
                {summary.location?.city || summary.location?.country ? (
                  <span>
                    {summary.location.city ? `${summary.location.city}, ` : ""}
                    {summary.location.country ?? ""}
                  </span>
                ) : null}
                {summary.location?.timezone ? (
                  <span>{summary.location.timezone}</span>
                ) : null}
                {summary.availability?.contractType ? (
                  <span className="flex items-center gap-1">
                    <Badge variant="outline" className="rounded-full">
                      {summary.availability.contractType.replace("-", " ")}
                    </Badge>
                  </span>
                ) : null}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {summary.social?.linkedinUrl ? (
              <Button asChild variant="default">
                <a
                  href={summary.social.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Connect
                </a>
              </Button>
            ) : null}
            {summary.social?.websiteUrl ? (
              <Button asChild variant="outline">
                <a
                  href={summary.social.websiteUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Visit Website
                </a>
              </Button>
            ) : null}
          </div>
        </div>

        <Tabs defaultValue="overview" className="mt-8">
          <TabsList className="grid grid-cols-3 sm:w-fit">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
          </TabsList>
          <TabsContent
            value="overview"
            className="text-muted-foreground pt-4 text-sm"
          >
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  Profile Strength
                </p>
                <p className="text-base font-semibold">
                  {summary.stats.completeness ?? 0}% complete
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  Lessons Completed
                </p>
                <p className="text-base font-semibold">
                  {summary.stats.lessonsCompleted ?? 0}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs tracking-wide uppercase">
                  Last Updated
                </p>
                <p className="text-base font-semibold">
                  {summary.stats.lastUpdated
                    ? new Date(summary.stats.lastUpdated).toLocaleDateString()
                    : "–"}
                </p>
              </div>
            </div>
          </TabsContent>
          <TabsContent
            value="activity"
            className="text-muted-foreground pt-4 text-sm"
          >
            Activity feed coming soon.
          </TabsContent>
          <TabsContent
            value="portfolio"
            className="text-muted-foreground pt-4 text-sm"
          >
            Portfolio deep-dive coming soon.
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
