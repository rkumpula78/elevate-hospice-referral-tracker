import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface CardSkeletonProps {
  count?: number;
}

export const CardSkeleton = ({ count = 1 }: CardSkeletonProps) => {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <Card key={index} className="modern-card overflow-hidden relative">
          {/* Shimmer effect */}
          <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/60 to-transparent" />
          
          <CardContent className="p-3 sm:p-4 md:p-6">
            {/* Gradient accent line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-gray-200 to-gray-300" />
            
            {/* Patient Name Skeleton */}
            <div className="mb-4">
              <Skeleton className="h-8 w-3/4 mb-3" />
              
              {/* Contact Info Skeleton */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>

            {/* Action Buttons Skeleton */}
            <div className="flex gap-2 mb-4">
              <Skeleton className="h-11 flex-1 rounded-md" />
              <Skeleton className="h-11 flex-1 rounded-md" />
            </div>

            {/* Organization Skeleton */}
            <div className="mb-4 p-3 sm:p-4 rounded-xl bg-gray-50">
              <Skeleton className="h-4 w-1/3 mb-2" />
              <Skeleton className="h-5 w-2/3" />
            </div>

            {/* Diagnosis Skeleton */}
            <div className="mb-4">
              <Skeleton className="h-3 w-1/4 mb-2" />
              <Skeleton className="h-4 w-full" />
            </div>

            {/* Status Skeleton */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-4 w-1/4" />
                <Skeleton className="h-10 w-48" />
              </div>
              {/* Progress Bar Skeleton */}
              <Skeleton className="h-2.5 w-full rounded-full" />
            </div>

            {/* Priority Skeleton */}
            <div className="flex items-center justify-between mb-4">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-28" />
            </div>

            {/* Footer Info Skeleton */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
};

export const ReferralCardsSkeleton = ({ count = 6 }: CardSkeletonProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
      <CardSkeleton count={count} />
    </div>
  );
};
