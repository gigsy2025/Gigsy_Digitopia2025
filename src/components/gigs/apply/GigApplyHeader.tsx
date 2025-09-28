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
    <header className="border-border bg-card space-y-4 rounded-2xl border p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-4">
        <AvatarStackWrapper
          authors={authors}
          size="md"
          maxVisible={1}
          showTooltip={false}
        />
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs tracking-wider uppercase">
            Applying for
          </p>
          <h1 className="text-foreground text-2xl font-semibold">
            {gig.title}
          </h1>
        </div>
      </div>

      <div className="text-muted-foreground flex flex-wrap items-center gap-3 text-sm">
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

      <p className="text-muted-foreground text-sm">{gig.description}</p>
    </header>
  );
}
