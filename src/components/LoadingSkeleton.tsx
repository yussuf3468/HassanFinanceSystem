import { memo } from "react";

interface LoadingSkeletonProps {
  count?: number;
  variant?: "product" | "text" | "card";
}

const LoadingSkeleton = memo(
  ({ count = 8, variant = "product" }: LoadingSkeletonProps) => {
    if (variant === "product") {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: count }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md overflow-hidden animate-pulse"
            >
              {/* Image skeleton */}
              <div className="w-full h-48 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer"></div>

              {/* Content skeleton */}
              <div className="p-5 space-y-3">
                {/* Title */}
                <div className="h-5 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer rounded-lg"></div>

                {/* Category */}
                <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer rounded-lg w-1/3"></div>

                {/* Price */}
                <div className="flex items-center justify-between">
                  <div className="h-6 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer rounded-lg w-1/2"></div>
                </div>

                {/* Button */}
                <div className="h-12 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer rounded-xl mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (variant === "text") {
      return (
        <div className="space-y-3">
          {Array.from({ length: count }).map((_, index) => (
            <div
              key={index}
              className="h-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer rounded-lg"
              style={{ width: `${Math.random() * 40 + 60}%` }}
            ></div>
          ))}
        </div>
      );
    }

    if (variant === "card") {
      return (
        <div className="space-y-4">
          {Array.from({ length: count }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl p-6 shadow-md animate-pulse"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer rounded-lg w-3/4"></div>
                  <div className="h-3 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 bg-[length:200%_100%] animate-shimmer rounded-lg w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    return null;
  }
);

LoadingSkeleton.displayName = "LoadingSkeleton";

export default LoadingSkeleton;
