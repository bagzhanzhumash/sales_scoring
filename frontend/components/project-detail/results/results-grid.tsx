"use client"

import { motion } from "framer-motion"
import { FileText, Edit2, MoreVertical, Play, Download, RotateCcw, CheckCircle, AlertCircle, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import type { AnalysisResult } from "@/types/projects"

interface ResultsGridProps {
  results: AnalysisResult[]
  selectedResults: string[]
  onSelectResult: (resultId: string, selected: boolean) => void
  onSelectAll: () => void
}

export function ResultsGrid({ results, selectedResults, onSelectResult, onSelectAll }: ResultsGridProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case "review_needed":
        return <AlertCircle className="w-4 h-4 text-amber-500" />
      case "failed":
        return <X className="w-4 h-4 text-red-500" />
      case "processing":
        return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      default:
        return <div className="w-4 h-4 bg-slate-400 rounded-full" />
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "from-emerald-500 to-emerald-600 text-white"
    if (score >= 60) return "from-amber-500 to-amber-600 text-white"
    return "from-red-500 to-red-600 text-white"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={selectedResults.length === results.length && results.length > 0}
            onChange={onSelectAll}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {selectedResults.length > 0 ? `${selectedResults.length} selected` : "Select all"}
          </span>
        </div>
        <span className="text-sm text-slate-600 dark:text-slate-400">{results.length} results</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {results.map((result, index) => (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`bg-white dark:bg-slate-800 rounded-xl p-6 shadow-lg border transition-all hover:shadow-xl ${
              selectedResults.includes(result.id)
                ? "border-blue-500 ring-2 ring-blue-500/20"
                : "border-slate-200 dark:border-slate-700"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={selectedResults.includes(result.id)}
                  onChange={(e) => onSelectResult(result.id, e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    {getStatusIcon(result.status)}
                  </div>
                  <h3 className="font-semibold text-slate-900 dark:text-white truncate" title={result.file_name}>
                    {result.file_name}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{formatDate(result.created_at)}</p>
                </div>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <Play className="w-4 h-4 mr-2" />
                    Preview
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reprocess
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Score Display */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Overall Score</span>
                <span className="text-sm text-slate-600 dark:text-slate-400">{result.accuracy || 0}% confidence</span>
              </div>
              <div className="relative">
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                  <div
                    className={`h-3 rounded-full bg-gradient-to-r ${getScoreColor(result.overall_score)} transition-all duration-500`}
                    style={{ width: `${result.overall_score}%` }}
                  />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-white drop-shadow-sm">{result.overall_score}%</span>
                </div>
              </div>
            </div>

            {/* Criteria Breakdown */}
            {result.criteria_scores && (
              <div className="mb-4">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Criteria Breakdown</h4>
                <div className="space-y-1">
                  {Object.entries(result.criteria_scores)
                    .slice(0, 3)
                    .map(([criterion, score]) => (
                      <div key={criterion} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400 capitalize">
                          {criterion.replace("_", " ")}
                        </span>
                        <span
                          className={`font-medium ${score >= 80 ? "text-emerald-600" : score >= 60 ? "text-amber-600" : "text-red-600"}`}
                        >
                          {score}%
                        </span>
                      </div>
                    ))}
                  {Object.keys(result.criteria_scores).length > 3 && (
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      +{Object.keys(result.criteria_scores).length - 3} more criteria
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon(result.status)}
                <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                  {result.status.replace("_", " ")}
                </span>
              </div>
              <Button size="sm" variant="outline">
                <Edit2 className="w-3 h-3 mr-1" />
                Edit
              </Button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
