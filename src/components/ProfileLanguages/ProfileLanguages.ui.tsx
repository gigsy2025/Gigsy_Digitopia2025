import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { ProfileLanguagesProps } from "./types";

export type ProfileLanguagesUIProps = ProfileLanguagesProps;

const languageLabels: Record<string, string> = {
  basic: "Basic",
  conversational: "Conversational",
  fluent: "Fluent",
  native: "Native",
};

export function ProfileLanguagesUI({ languages }: ProfileLanguagesUIProps) {
  if (!languages.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Languages</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        {languages.map((language) => (
          <Badge
            key={language.code}
            variant="outline"
            className="rounded-full px-4 py-1"
          >
            <span className="font-medium">{language.name}</span>
            {language.level ? (
              <span className="text-muted-foreground ml-2 text-xs uppercase">
                {languageLabels[language.level] ?? language.level}
              </span>
            ) : null}
          </Badge>
        ))}
      </CardContent>
    </Card>
  );
}
