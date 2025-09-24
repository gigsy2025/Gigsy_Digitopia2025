"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { ProfileSkillsProps } from "./types";

export type ProfileSkillsUIProps = ProfileSkillsProps;

export function ProfileSkillsUI({ skills }: ProfileSkillsUIProps) {
  if (!skills.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Skills & Endorsements</CardTitle>
        <div className="flex flex-wrap gap-2">
          {skills.slice(0, 3).map((skill) => (
            <Badge key={skill.name} variant="secondary" className="uppercase">
              {skill.name}
            </Badge>
          ))}
          {skills.length > 3 ? (
            <Badge variant="outline">+{skills.length - 3} more</Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {skills.map((skill) => (
          <div key={skill.name} className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="font-medium">{skill.name}</span>
                {skill.experienceLevel ? (
                  <Badge variant="outline" className="rounded-full text-xs">
                    {skill.experienceLevel}
                  </Badge>
                ) : null}
              </div>
              <div className="text-muted-foreground text-xs uppercase">
                {skill.endorsementsCount ?? 0} endorsements
              </div>
            </div>
            <Progress value={skill.endorsementStrength ?? 0} className="h-2" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
