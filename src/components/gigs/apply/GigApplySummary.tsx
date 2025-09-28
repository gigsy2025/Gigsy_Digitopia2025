import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { GigDetail } from "@/types/gigs";

export interface GigApplySummaryProps {
  gig: GigDetail;
  onViewApplications?: () => void;
}

export function GigApplySummary({ gig, onViewApplications }: GigApplySummaryProps) {
  return (
    <Card className="border-success/40 bg-success/5">
      <CardHeader>
        <h2 className="text-xl font-semibold text-success-foreground">
          Application already submitted
        </h2>
        <p className="text-sm text-muted-foreground">
          You applied to {gig.title}. We&apos;ll notify you as soon as there&apos;s an update.
        </p>
      </CardHeader>
      <CardContent className="space-y-4 text-sm text-muted-foreground">
        <p>
          When employers review applications, they see your profile, portfolio, and the cover letter you shared.
        </p>
        <p>
          Need to tweak something? We&apos;re working on editable submissions. For now, reach out to support and we&apos;ll help.
        </p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" onClick={onViewApplications}>
          View my applications
        </Button>
      </CardFooter>
    </Card>
  );
}
