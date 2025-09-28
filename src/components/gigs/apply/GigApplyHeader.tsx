import { Badge } from "@/components/ui/badge";
import { AvatarStackWrapper } from "@/components/ui/AvatarStackWrapper";
import type { GigDetail } from "@/types/gigs";
import type { Author } from "@/types/course";

export interface GigApplyHeaderProps {
  gig: GigDetail;
}

export function GigApplyHeader({ gig }: GigApplyHeaderProps) {
  const authors: Author[] = [
    {
      id: gig.employerId as unknown as string,
      name: "Hiring Manager",
      avatarUrl: "",
    },
  ];

  return (
    <header className="space-y-4 rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <AvatarStackWrapper authors={authors} size="md" maxVisible={1} showTooltip={false} />
        <div className="space-y-1">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Applying for
          </p>
          <h1 className="text-2xl font-semibold text-foreground">{gig.title}</h1>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <Badge variant="secondary" className="capitalize">
          {gig.category}
        </Badge>
        <Badge variant="outline" className="capitalize">
          {gig.experienceRequired} experience
        </Badge>
        <Badge variant="outline" className="capitalize">
          {gig.difficultyLevel}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">
        {gig.description}
      </p>
    </header>
  );
}
