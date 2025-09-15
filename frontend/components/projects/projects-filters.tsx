"use client"

import { useState, useEffect } from "react"
import { Search, Filter, X, ChevronDown } from "lucide-react"
import { useProjectsStore } from "@/store/projects-store"
import { useDebounce } from "@/hooks/use-debounce"
import { Button } from "@/components/ui/button"

interface ProjectsFiltersProps {
  totalCount: number
  filteredCount: number
}

export function ProjectsFilters({ totalCount, filteredCount }: ProjectsFiltersProps) {
  const { filters, searchTerm, setFilters, setSearchTerm } = useProjectsStore()
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)
  const [showFilters, setShowFilters] = useState(false)

  const debouncedSearchTerm = useDebounce(localSearchTerm, 300)

  useEffect(() => {
    setSearchTerm(debouncedSearchTerm)
  }, [debouncedSearchTerm, setSearchTerm])

  const statusOptions = [
    { value: "all", label: "All Projects", count: totalCount },
    { value: "active", label: "Active", count: 0 },
    { value: "completed", label: "Completed", count: 0 },
    { value: "pending", label: "Pending", count: 0 },
    { value: "failed", label: "Failed", count: 0 },
  ]

  const dateRangeOptions = [
    { value: "all", label: "All Time" },
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
    { value: "90d", label: "Last 90 days" },
  ]

  const sortOptions = [
    { value: "recent", label: "Most Recent" },
    { value: "name", label: "Name" },
    { value: "progress", label: "Progress" },
    { value: "accuracy", label: "Accuracy" },
  ]

  const clearAllFilters = () => {
    setFilters({
      status: "all",
      dateRange: "all",
      sortBy: "recent",
      sortOrder: "desc",
      page: 1,
    })
    setLocalSearchTerm("")
    setSearchTerm("")
  }

  const hasActiveFilters =
    filters.status !== "all" || filters.dateRange !== "all" || filters.sortBy !== "recent" || searchTerm !== ""

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-xl p-6 shadow-xl border border-white/20">
      {/* Search Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={localSearchTerm}
            onChange={(e) => setLocalSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {localSearchTerm && (
            <button
              onClick={() => {
                setLocalSearchTerm("")
                setSearchTerm("")
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex items-center space-x-4">
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {filteredCount} of {totalCount} projects
          </span>

          <Button variant="outline" onClick={() => setShowFilters(!showFilters)} className="lg:hidden">
            <Filter className="w-4 h-4 mr-2" />
            Filters
            <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${showFilters ? "rotate-180" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className={`grid grid-cols-1 lg:grid-cols-4 gap-4 ${showFilters ? "block" : "hidden lg:grid"}`}>
        {/* Status Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ status: e.target.value as any })}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date Range Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date Range</label>
          <select
            value={filters.dateRange}
            onChange={(e) => setFilters({ dateRange: e.target.value as any })}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {dateRangeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort Filter */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => setFilters({ sortBy: e.target.value as any })}
            className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters */}
        <div className="flex items-end">
          {hasActiveFilters && (
            <Button variant="outline" onClick={clearAllFilters} className="w-full">
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
