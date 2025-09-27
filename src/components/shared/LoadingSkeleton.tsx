import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export function LoadingSkeleton({
  lines = 3,
  className,
}: LoadingSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)} data-testid="loading-skeleton">
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn(
            "h-4 w-full",
            index === 0 && "h-6",
            index === lines - 1 && "w-3/4",
          )}
        />
      ))}
    </div>
  );
}
