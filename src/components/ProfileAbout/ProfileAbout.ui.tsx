import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProfileAboutProps } from "./types";

export type ProfileAboutUIProps = ProfileAboutProps;

export function ProfileAboutUI({ about }: ProfileAboutUIProps) {
  if (!about?.bio && !about?.highlights?.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>About</CardTitle>
      </CardHeader>
      <CardContent className="text-muted-foreground space-y-4 text-sm leading-relaxed">
        {about.bio ? <p className="whitespace-pre-line">{about.bio}</p> : null}

        {about.highlights?.length ? (
          <ul className="grid gap-2">
            {about.highlights.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span
                  className="bg-primary/60 mt-1 h-2 w-2 rounded-full"
                  aria-hidden
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
