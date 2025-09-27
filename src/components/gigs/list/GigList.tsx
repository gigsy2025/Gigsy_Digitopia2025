import type { GigListItem } from "@/types/gigs";
import { GigCard } from "@/components/gigs/list/GigCard";

export interface GigListProps {
  gigs: Array<
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
  onApply?: (gigId: GigListItem["_id"]) => void;
  onSave?: (gigId: GigListItem["_id"]) => void;
  onSelect?: (gigId: GigListItem["_id"]) => void;
}

export function GigList({ gigs, onApply, onSave, onSelect }: GigListProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {gigs.map((gig) => (
        <GigCard
          key={gig._id}
          gig={gig}
          onApply={onApply}
          onSave={onSave}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
