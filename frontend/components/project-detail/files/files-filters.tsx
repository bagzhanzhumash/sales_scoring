"use client"

import { Search } from "lucide-react"
import type { AudioFile } from "@/types/projects"

interface FilesFiltersProps {
  filters: {
    status: string
    search: string
    sortBy: string
  }
  onFiltersChange: (filters: any) => void
  files: AudioFile[]
}

export function FilesFilters({ filters, onFiltersChange, files }: FilesFiltersProps) {
  const statusCounts = {
    all: files.length,
    completed: files.filter((f) => f.status === "completed").length,
    processing: files.filter((f) => f.status === "processing").length,
    pending: files.filter((f) => f.status === "pending").length,
    failed: files.filter((f) => f.status === "failed").length,
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search files..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All ({statusCounts.all})</option>
            <option value="completed">Completed ({statusCounts.completed})</option>
            <option value="processing">Processing ({statusCounts.processing})</option>
            <option value="pending">Pending ({statusCounts.pending})</option>
            <option value="failed">Failed ({statusCounts.failed})</option>
          </select>
        </div>

        {/* Sort Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Sort by</label>
          <select
            value={filters.sortBy}
            onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value })}
            className="px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recent">Most Recent</option>
            <option value="name">Name</option>
            <option value="size">File Size</option>
            <option value="duration">Duration</option>
            <option value="status">Status</option>
          </select>
        </div>
      </div>
    </div>
  )
}
