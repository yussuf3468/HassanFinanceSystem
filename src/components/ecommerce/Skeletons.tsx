export default function ProductSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-md overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="w-full aspect-square bg-slate-200 dark:bg-slate-700" />

      {/* Content Skeleton */}
      <div className="p-4 space-y-3">
        {/* Category */}
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20" />

        {/* Title */}
        <div className="space-y-2">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
        </div>

        {/* Price */}
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-24" />

        {/* Button */}
        <div className="h-10 bg-slate-200 dark:bg-slate-700 rounded-lg w-full" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} />
      ))}
    </div>
  );
}

export function OrderSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 animate-pulse">
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-32" />
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48" />
          </div>
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20" />
        </div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-full" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/4" />
      </div>
    </div>
  );
}
