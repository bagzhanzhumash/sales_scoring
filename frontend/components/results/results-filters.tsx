"use client"

import { Search, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AnalysisResult } from "@/types/projects"

interface ResultsFiltersProps {
  filters: {
    status: string
    search: string
    minScore: number
    maxScore: number
    sortBy: string
  }
  onFiltersChange: (filters: any) => void
  results: AnalysisResult[]
}

export function ResultsFilters({ filters, onFiltersChange, results }: ResultsFiltersProps) {
  const statusCounts = {
    all: results.length,
    completed: results.filter((r) => r.status === "completed").length,
    pending: results.filter((r) => r.status === "pending").length,
    failed: results.filter((r) => r.status === "failed").length,
  }

  const hasActiveFilters = 
    filters.status !== "all" || 
    filters.search !== "" || 
    filters.minScore > 0 || 
    filters.maxScore < 100

  const clearFilters = () => {
    onFiltersChange({
      status: "all",
      search: "",
      minScore: 0,
      maxScore: 100,
      sortBy: "recent",
    })
  }

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Filters & Search</h3>
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search results..."
          value={filters.search}
          onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {filters.search && (
          <button
            onClick={() => onFiltersChange({ ...filters, search: "" })}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All ({statusCounts.all})</option>
            <option value="completed">Completed ({statusCounts.completed})</option>
            <option value="pending">Pending ({statusCounts.pending})</option>
            <option value="failed">Failed ({statusCounts.failed})</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Score Range: {filters.minScore}% - {filters.maxScore}%
          </label>
          <div className="flex items-center space-x-2">
            <input
              type="range"
              min="0"
              max="100"
              value={filters.minScore}
              onChange={(e) => onFiltersChange({ ...filters, minScore: Number(e.target.value) })}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-xs text-slate-500">to</span>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.maxScore}
              onChange={(e) => onFiltersChange({ ...filters, maxScore: Number(e.target.value) })}
              className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sort by</label>
          <select
            value={filters.sortBy}
            onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value })}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="recent">Most Recent</option>
            <option value="score_high">Highest Score</option>
            <option value="score_low">Lowest Score</option>
            <option value="name">File Name</option>
            <option value="confidence">Confidence</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confidence</label>
          <select className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="all">All Levels</option>
            <option value="high">High (90%+)</option>
            <option value="medium">Medium (70-89%)</option>
            <option value="low">Low (&lt;70%)</option>
          </select>
        </div>
      </div>
    </div>
  )
} 