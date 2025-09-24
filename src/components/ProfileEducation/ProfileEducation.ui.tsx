import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProfileEducationProps } from "./types";

export type ProfileEducationUIProps = ProfileEducationProps;

export function ProfileEducationUI({ education }: ProfileEducationUIProps) {
  if (!education.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Education</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {education.map((item, index) => (
          <div
            key={item.id ?? `${item.schoolName}-${index}`}
            className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex flex-col gap-1">
              <p className="text-base font-semibold">{item.schoolName}</p>
              <p className="text-muted-foreground text-sm">{item.degree}</p>
            </div>
            <span className="text-muted-foreground text-xs tracking-wide uppercase">
              {item.start} — {item.end ?? "Present"}
            </span>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
