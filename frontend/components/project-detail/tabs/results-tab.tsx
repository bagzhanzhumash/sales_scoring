"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Download, Filter, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ResultsTable } from "../results/results-table"
import { ResultsGrid } from "../results/results-grid"
import { ResultsFilters } from "../results/results-filters"
import { BulkResultsActions } from "../results/bulk-results-actions"
import { ExportModal } from "../modals/export-modal"
import type { AnalysisResult } from "@/types/projects"

interface ResultsTabProps {
  projectId: string
  results: AnalysisResult[]
  isLoading: boolean
  onRefresh: () => void
}

export function ResultsTab({ projectId, results, isLoading, onRefresh }: ResultsTabProps) {
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")
  const [selectedResults, setSelectedResults] = useState<string[]>([])
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    minScore: 0,
    maxScore: 100,
    sortBy: "recent",
  })

  const filteredResults = results.filter((result) => {
    if (filters.status !== "all" && result.status !== filters.status) return false
    if (filters.search && !result.file_name.toLowerCase().includes(filters.search.toLowerCase())) return false
    if (result.overall_score < filters.minScore || result.overall_score > filters.maxScore) return false
    return true
  })

  const handleSelectResult = (resultId: string, selected: boolean) => {
    if (selected) {
      setSelectedResults([...selectedResults, resultId])
    } else {
      setSelectedResults(selectedResults.filter((id) => id !== resultId))
    }
  }

  const handleSelectAll = () => {
    if (selectedResults.length === filteredResults.length) {
      setSelectedResults([])
    } else {
      setSelectedResults(filteredResults.map((r) => r.id))
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Button onClick={() => setExportModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
              <Download className="w-4 h-4 mr-2" />
              Export All
            </Button>
            {selectedResults.length > 0 && (
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {selectedResults.length} result{selectedResults.length !== 1 ? "s" : ""} selected
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}>
              {viewMode === "table" ? <FileText className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <ResultsFilters filters={filters} onFiltersChange={setFilters} results={results} />

        {/* Bulk Actions */}
        {selectedResults.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <BulkResultsActions
              selectedResults={selectedResults}
              onClearSelection={() => setSelectedResults([])}
              projectId={projectId}
            />
          </motion.div>
        )}

        {/* Results Display */}
        <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/20">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredResults.length === 0 ? (
            <div className="text-center py-12 px-6">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">No results found</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Results will appear here once your audio files have been processed.
              </p>
            </div>
          ) : viewMode === "table" ? (
            <ResultsTable
              results={filteredResults}
              selectedResults={selectedResults}
              onSelectResult={handleSelectResult}
              onSelectAll={handleSelectAll}
            />
          ) : (
            <ResultsGrid
              results={filteredResults}
              selectedResults={selectedResults}
              onSelectResult={handleSelectResult}
              onSelectAll={handleSelectAll}
            />
          )}
        </div>
      </div>

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        projectId={projectId}
        selectedResults={selectedResults}
      />
    </>
  )
}
