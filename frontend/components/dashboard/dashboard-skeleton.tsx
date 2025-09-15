export function DashboardSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div>
        <div className="h-4 bg-slate-200 rounded w-24 mb-4"></div>
        <div className="h-8 bg-slate-200 rounded w-64"></div>
      </div>

      {/* Welcome Banner Skeleton */}
      <div className="h-32 bg-slate-200 rounded-2xl"></div>

      {/* KPI Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/95 backdrop-blur-xl rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
              <div className="h-4 bg-slate-200 rounded w-16"></div>
            </div>
            <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-slate-200 rounded w-16"></div>
          </div>
        ))}
      </div>

      {/* Main Content Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-6 h-96 bg-slate-200 rounded-xl"></div>
        <div className="lg:col-span-4 h-96 bg-slate-200 rounded-xl"></div>
        <div className="lg:col-span-2 h-96 bg-slate-200 rounded-xl"></div>
      </div>

      {/* Quick Actions Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
        ))}
      </div>
    </div>
  )
}
