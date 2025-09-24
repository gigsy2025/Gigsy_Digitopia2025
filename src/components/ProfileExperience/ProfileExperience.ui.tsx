import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProfileExperienceProps } from "./types";

export type ProfileExperienceUIProps = ProfileExperienceProps;

export function ProfileExperienceUI({
  experience,
  title = "Experience",
}: ProfileExperienceUIProps) {
  if (!experience.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="border-border/60 relative ml-4 border-l pl-6">
          {experience.map((item, index) => (
            <div
              key={item.id ?? `${item.companyName}-${index}`}
              className="relative pb-6 last:pb-0"
            >
              <span
                className="bg-primary absolute -left-[9px] mt-1 h-3 w-3 rounded-full"
                aria-hidden
              />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <p className="text-base font-semibold">{item.role}</p>
                  <p className="text-muted-foreground text-sm">
                    {item.companyName}
                  </p>
                </div>
                <span className="text-muted-foreground text-xs tracking-wide uppercase">
                  {item.start} — {item.end ?? "Present"}
                </span>
              </div>
              {item.technologies?.length ? (
                <div className="mt-2 flex flex-wrap gap-2">
                  {item.technologies.map((tech) => (
                    <Badge
                      key={tech}
                      variant="outline"
                      className="rounded-full"
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>
              ) : null}
              {item.description ? (
                <p className="text-muted-foreground mt-3 text-sm leading-relaxed">
                  {item.description}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
