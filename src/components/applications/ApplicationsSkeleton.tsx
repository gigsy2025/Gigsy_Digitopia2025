import { ApplicationCardSkeleton } from "@/components/applications/ApplicationCardSkeleton";

export function ApplicationsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <ApplicationCardSkeleton key={index} />
      ))}
    </div>
  );
}
