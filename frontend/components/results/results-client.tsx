"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import { projectsApi } from "@/lib/api/projects-api"
import { ResultsBreadcrumb } from "./results-breadcrumb"
import { ResultsHeader } from "./results-header"
import { ResultsSummary } from "./results-summary"
import { ResultsFilters } from "./results-filters"
import { ResultsTable } from "./results-table"
import { ResultsGrid } from "./results-grid"
import { BulkResultsActions } from "./bulk-results-actions"
import { ResultDetailPanel } from "./result-detail-panel"
import { SpeechScoringInterface } from "./speech-scoring-interface"
import { ExportModal } from "./export-modal"
import { useResultsStore } from "@/store/results-store"
import type { Project, AnalysisResult } from "@/types/projects"

interface ResultsClientProps {
  projectId?: string
  initialProject?: Project
  initialResults?: AnalysisResult[]
}

export function ResultsClient({ projectId, initialProject, initialResults }: ResultsClientProps) {
  const [exportModalOpen, setExportModalOpen] = useState(false)
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null)
  const [scoringInterfaceOpen, setScoringInterfaceOpen] = useState(false)
  const [scoringResult, setScoringResult] = useState<AnalysisResult | null>(null)

  const { filters, selectedIds, viewMode, setFilters, toggleSelection, clearSelection, setViewMode } = useResultsStore()

  const { data: results, isLoading } = useQuery({
    queryKey: ["results", projectId, filters],
    queryFn: () => (projectId ? projectsApi.getProjectResults(projectId) : projectsApi.getAllResults(filters)),
    initialData: initialResults,
    refetchInterval: 30000,
  })

  const filteredResults =
    results?.filter((result) => {
      // filename can come as camelCase (fileName) or snake_case (file_name)
      // always coerce to string before calling toLowerCase()
      const fileName = String((result as any).fileName ?? (result as any).file_name ?? "")

      // --- status ---
      if (filters.status !== "all" && result.status !== filters.status) return false

      // --- search ---
      const searchTerm = String(filters.search ?? "").toLowerCase()
      if (searchTerm && !fileName.toLowerCase().includes(searchTerm)) return false

      // --- score range ---
      if (result.overall_score < filters.minScore || result.overall_score > filters.maxScore) return false

      return true
    }) || []

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  return (
    <>
      <motion.div
        className="container mx-auto px-4 py-8 space-y-8"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Breadcrumb */}
        <motion.div variants={itemVariants}>
          <ResultsBreadcrumb projectId={projectId} project={initialProject} />
        </motion.div>

        {/* Header */}
        <motion.div variants={itemVariants}>
          <ResultsHeader
            project={initialProject}
            totalResults={filteredResults.length}
            onExport={() => setExportModalOpen(true)}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </motion.div>

        {/* Summary */}
        <motion.div variants={itemVariants}>
          <ResultsSummary results={filteredResults} />
        </motion.div>

        {/* Filters */}
        <motion.div variants={itemVariants}>
          <ResultsFilters filters={filters} onFiltersChange={setFilters} results={results || []} />
        </motion.div>

        {/* Bulk Actions */}
        {selectedIds.length > 0 && (
          <motion.div
            variants={itemVariants}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <BulkResultsActions
              selectedResults={selectedIds}
              onClearSelection={clearSelection}
              onExport={() => setExportModalOpen(true)}
            />
          </motion.div>
        )}

        {/* Results Display */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className={`${selectedResult ? "lg:col-span-8" : "lg:col-span-12"} transition-all duration-300`}>
            <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/20">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredResults.length === 0 ? (
                <div className="text-center py-12 px-6">
                  <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    📊
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">No results found</h3>
                  <p className="text-slate-600 dark:text-slate-400">
                    {filters.status !== "all" || filters.search || filters.minScore > 0 || filters.maxScore < 100
                      ? "Try adjusting your filters to see more results."
                      : "Process some audio files to see analysis results here."}
                  </p>
                </div>
              ) : viewMode === "table" ? (
                <ResultsTable
                  results={filteredResults}
                  selectedResults={selectedIds}
                  onSelectResult={toggleSelection}
                  onSelectAll={() => {
                    if (selectedIds.length === filteredResults.length) {
                      clearSelection()
                    } else {
                      filteredResults.forEach((result) => toggleSelection(result.id, true))
                    }
                  }}
                  onRowClick={setSelectedResult}
                />
              ) : (
                <div className="p-6">
                  <ResultsGrid
                    results={filteredResults}
                    selectedResults={selectedIds}
                    onSelectResult={toggleSelection}
                    onSelectAll={() => {
                      if (selectedIds.length === filteredResults.length) {
                        clearSelection()
                      } else {
                        filteredResults.forEach((result) => toggleSelection(result.id, true))
                      }
                    }}
                    onCardClick={setSelectedResult}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Detail Panel */}
          {selectedResult && (
            <motion.div
              className="lg:col-span-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <ResultDetailPanel
                result={selectedResult}
                onClose={() => setSelectedResult(null)}
                onEdit={(updates) => {
                  // TODO: Implement result update
                  console.log("Updating result:", updates)
                }}
                onOpenScoring={(result) => {
                  setScoringResult(result)
                  setScoringInterfaceOpen(true)
                }}
              />
            </motion.div>
          )}
        </motion.div>
      </motion.div>

      {/* Speech Scoring Interface */}
      {scoringInterfaceOpen && scoringResult && (
        <SpeechScoringInterface
          result={scoringResult}
          onScoreUpdate={(categoryId, criterionId, score, comment) => {
            console.log("Score update:", { categoryId, criterionId, score, comment })
            // TODO: Implement score update API call
          }}
          onSave={() => {
            console.log("Saving scores...")
            // TODO: Implement save functionality
            setScoringInterfaceOpen(false)
          }}
          onClose={() => setScoringInterfaceOpen(false)}
          transcript="Mock transcript data..." // TODO: Get real transcript
          audioUrl={undefined} // TODO: Get real audio URL
        />
      )}

      {/* Export Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        projectId={projectId}
        selectedResults={selectedIds}
      />
    </>
  )
}
