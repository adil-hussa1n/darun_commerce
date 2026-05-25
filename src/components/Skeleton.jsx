import React from 'react';

// Single Statistics Card Skeleton
export function StatSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-white border border-beauty-rose/20 shadow-xs flex items-center justify-between">
      <div className="space-y-2.5 w-full">
        <div className="h-3 w-20 skeleton-shimmer rounded-md" />
        <div className="h-8 w-28 skeleton-shimmer rounded-md" />
      </div>
      <div className="w-12 h-12 rounded-xl skeleton-shimmer shrink-0" />
    </div>
  );
}

// Single Product Grid Card Skeleton
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-beauty-rose/20 shadow-xs overflow-hidden flex flex-col h-[400px]">
      <div className="h-48 w-full skeleton-shimmer" />
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="h-3.5 w-16 skeleton-shimmer rounded-md" />
          <div className="h-5 w-4/5 skeleton-shimmer rounded-md" />
        </div>
        <div className="flex justify-between items-center">
          <div className="h-6 w-16 skeleton-shimmer rounded-md" />
          <div className="h-4 w-20 skeleton-shimmer rounded-md" />
        </div>
        <div className="space-y-2">
          <div className="h-10 w-full skeleton-shimmer rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// Single Table Row Skeleton
export function TableRowSkeleton() {
  return (
    <tr className="border-b border-beauty-rose/10">
      <td className="px-6 py-4"><div className="h-4 w-24 skeleton-shimmer rounded-md" /></td>
      <td className="px-6 py-4"><div className="h-4 w-40 skeleton-shimmer rounded-md" /></td>
      <td className="px-6 py-4"><div className="h-4.5 w-16 skeleton-shimmer rounded-full" /></td>
      <td className="px-6 py-4"><div className="h-4 w-12 skeleton-shimmer rounded-md" /></td>
      <td className="px-6 py-4"><div className="h-4 w-16 skeleton-shimmer rounded-md" /></td>
      <td className="px-6 py-4"><div className="h-4 w-20 skeleton-shimmer rounded-md" /></td>
    </tr>
  );
}

// A full loading page placeholder with stats and table
export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse-subtle">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
        <StatSkeleton />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-beauty-rose/20 shadow-xs space-y-4">
          <div className="h-5 w-32 skeleton-shimmer rounded-md" />
          <div className="space-y-3">
            <div className="h-8 skeleton-shimmer rounded-md" />
            <div className="h-8 skeleton-shimmer rounded-md" />
            <div className="h-8 skeleton-shimmer rounded-md" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-beauty-rose/20 shadow-xs space-y-4">
          <div className="h-5 w-32 skeleton-shimmer rounded-md" />
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-lg skeleton-shimmer" />
              <div className="space-y-2 w-full">
                <div className="h-4 w-2/3 skeleton-shimmer rounded-md" />
                <div className="h-3 w-1/3 skeleton-shimmer rounded-md" />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-12 h-12 rounded-lg skeleton-shimmer" />
              <div className="space-y-2 w-full">
                <div className="h-4 w-2/3 skeleton-shimmer rounded-md" />
                <div className="h-3 w-1/3 skeleton-shimmer rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
