export function ProjectsSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="h-4 bg-slate-200 rounded w-32"></div>

      {/* Title Skeleton */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 bg-slate-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-64"></div>
        </div>
        <div className="h-10 bg-slate-200 rounded w-32"></div>
      </div>

      {/* Stats Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-white/95 backdrop-blur-xl rounded-xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
            </div>
            <div className="h-4 bg-slate-200 rounded w-24 mb-2"></div>
            <div className="h-8 bg-slate-200 rounded w-16"></div>
          </div>
        ))}
      </div>

      {/* Filters Skeleton */}
      <div className="bg-white/95 backdrop-blur-xl rounded-xl p-6 shadow-xl">
        <div className="h-10 bg-slate-200 rounded mb-4"></div>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-200 rounded"></div>
          ))}
        </div>
      </div>

      {/* Projects Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white/95 backdrop-blur-xl rounded-xl p-6 shadow-xl">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3 flex-1">
                <div className="w-4 h-4 bg-slate-200 rounded mt-1"></div>
                <div className="flex-1">
                  <div className="h-6 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded w-full"></div>
                </div>
              </div>
              <div className="w-8 h-8 bg-slate-200 rounded"></div>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between">
                <div className="h-6 bg-slate-200 rounded w-20"></div>
                <div className="h-4 bg-slate-200 rounded w-16"></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {[...Array(3)].map((_, j) => (
                  <div key={j} className="text-center">
                    <div className="h-6 bg-slate-200 rounded w-8 mx-auto mb-1"></div>
                    <div className="h-3 bg-slate-200 rounded w-12 mx-auto"></div>
                  </div>
                ))}
              </div>
              <div className="h-2 bg-slate-200 rounded"></div>
              <div className="flex justify-between">
                <div className="h-4 bg-slate-200 rounded w-20"></div>
                <div className="h-4 bg-slate-200 rounded w-16"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
