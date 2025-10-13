// import React from "react";

interface ProductSkeletonProps {
  count?: number;
}

export function ProductSkeleton({ count = 8 }: ProductSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden animate-pulse"
        >
          {/* Image skeleton */}
          <div className="aspect-square bg-slate-200 w-full"></div>

          {/* Content skeleton */}
          <div className="p-6 space-y-4">
            {/* Title skeleton */}
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>

            {/* Price skeleton */}
            <div className="h-6 bg-slate-200 rounded w-1/2"></div>

            {/* Stock skeleton */}
            <div className="h-3 bg-slate-200 rounded w-1/3"></div>

            {/* Buttons skeleton */}
            <div className="space-y-2">
              <div className="h-10 bg-slate-200 rounded-xl"></div>
              <div className="h-10 bg-slate-200 rounded-xl"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative min-h-[80vh] bg-gradient-to-br from-blue-50 via-white to-purple-50 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side skeleton */}
          <div className="text-center lg:text-left space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/2 mx-auto lg:mx-0"></div>
            <div className="space-y-4">
              <div className="h-12 bg-slate-200 rounded w-full"></div>
              <div className="h-12 bg-slate-200 rounded w-3/4"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-slate-200 rounded w-full"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center lg:justify-start">
              <div className="h-12 bg-slate-200 rounded-xl w-32"></div>
              <div className="h-12 bg-slate-200 rounded-xl w-32"></div>
            </div>
          </div>

          {/* Right side skeleton */}
          <div className="relative">
            <div className="aspect-square bg-slate-200 rounded-3xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm shadow-lg border-b border-slate-200 animate-pulse">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="h-8 bg-slate-200 rounded w-32"></div>
          <div className="flex items-center space-x-4">
            <div className="h-10 bg-slate-200 rounded-xl w-64 hidden md:block"></div>
            <div className="flex space-x-2">
              <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
              <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
              <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
