export function ProjectDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-8 animate-pulse">
      {/* Breadcrumb Skeleton */}
      <div className="h-4 bg-slate-200 rounded w-64"></div>

      {/* Header Skeleton */}
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1">
            <div className="h-8 bg-slate-200 rounded w-64 mb-3"></div>
            <div className="h-6 bg-slate-200 rounded w-96 mb-4"></div>
            <div className="flex space-x-4">
              <div className="h-4 bg-slate-200 rounded w-32"></div>
              <div className="h-4 bg-slate-200 rounded w-24"></div>
              <div className="h-4 bg-slate-200 rounded w-28"></div>
            </div>
          </div>
          <div className="flex space-x-3">
            <div className="h-10 bg-slate-200 rounded w-20"></div>
            <div className="h-10 bg-slate-200 rounded w-24"></div>
            <div className="h-10 bg-slate-200 rounded w-10"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-slate-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <div className="w-6 h-6 bg-slate-200 rounded"></div>
                <div className="h-4 bg-slate-200 rounded w-16"></div>
              </div>
              <div className="h-8 bg-slate-200 rounded w-12"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Tab Navigation Skeleton */}
      <div className="bg-white/95 backdrop-blur-xl rounded-xl p-2">
        <div className="flex space-x-1">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-slate-200 rounded-lg w-24"></div>
          ))}
        </div>
      </div>

      {/* Content Skeleton */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white/95 backdrop-blur-xl rounded-xl p-6 h-64">
              <div className="h-6 bg-slate-200 rounded w-32 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded w-full"></div>
                <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
