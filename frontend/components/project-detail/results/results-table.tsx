"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  ChevronUp,
  ChevronDown,
  Edit2,
  Check,
  X,
  MoreVertical,
  Play,
  Download,
  RotateCcw,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import type { AnalysisResult } from "@/types/projects"

interface ResultsTableProps {
  results: AnalysisResult[]
  selectedResults: string[]
  onSelectResult: (resultId: string, selected: boolean) => void
  onSelectAll: () => void
}

export function ResultsTable({ results, selectedResults, onSelectResult, onSelectAll }: ResultsTableProps) {
  const [sortBy, setSortBy] = useState<string>("created_at")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc")
  const [editingScore, setEditingScore] = useState<string | null>(null)
  const [editValue, setEditValue] = useState<number>(0)

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setSortOrder("desc")
    }
  }

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
    if (score >= 80) return "text-emerald-600 bg-emerald-50"
    if (score >= 60) return "text-amber-600 bg-amber-50"
    return "text-red-600 bg-red-50"
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleEditScore = (resultId: string, currentScore: number) => {
    setEditingScore(resultId)
    setEditValue(currentScore)
  }

  const handleSaveScore = () => {
    // TODO: Implement score update API call
    console.log("Saving score:", editValue, "for result:", editingScore)
    setEditingScore(null)
  }

  const SortButton = ({ column, children }: { column: string; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(column)}
      className="flex items-center space-x-1 text-left font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100"
    >
      <span>{children}</span>
      {sortBy === column &&
        (sortOrder === "asc" ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
    </button>
  )

  return (
    <div className="overflow-hidden">
      {/* Table Header */}
      <div className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-12 gap-4 px-6 py-3 text-sm">
          <div className="col-span-1 flex items-center">
            <input
              type="checkbox"
              checked={selectedResults.length === results.length && results.length > 0}
              onChange={onSelectAll}
              className="w-4 h-4 text-blue-600 rounded"
            />
          </div>
          <div className="col-span-3">
            <SortButton column="file_name">File Name</SortButton>
          </div>
          <div className="col-span-2">
            <SortButton column="overall_score">Score</SortButton>
          </div>
          <div className="col-span-2">
            <SortButton column="status">Status</SortButton>
          </div>
          <div className="col-span-2">
            <SortButton column="accuracy">Confidence</SortButton>
          </div>
          <div className="col-span-1">
            <SortButton column="created_at">Date</SortButton>
          </div>
          <div className="col-span-1">Actions</div>
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-slate-200 dark:divide-slate-700">
        {results.map((result, index) => {
          const resultId = result.id || result.audio_file_id || `result-${index}`
          return (
            <motion.div
              key={resultId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className={`grid grid-cols-12 gap-4 px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${
                selectedResults.includes(resultId) ? "bg-blue-50 dark:bg-blue-900/20" : ""
              }`}
            >
              {/* Checkbox */}
              <div className="col-span-1 flex items-center">
                <input
                  type="checkbox"
                  checked={selectedResults.includes(resultId)}
                  onChange={(e) => onSelectResult(resultId, e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </div>

              {/* File Name */}
              <div className="col-span-3 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="font-medium text-slate-900 dark:text-white truncate" title={result.file_name || result.filename}>
                  {result.file_name || result.filename}
                </span>
              </div>

              {/* Score */}
              <div className="col-span-2 flex items-center">
                {editingScore === resultId ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={editValue}
                      onChange={(e) => setEditValue(Number(e.target.value))}
                      className="w-16 px-2 py-1 border border-slate-300 rounded text-sm"
                      min="0"
                      max="100"
                      autoFocus
                    />
                    <button onClick={handleSaveScore} className="text-emerald-600 hover:text-emerald-700">
                      <Check className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditingScore(null)} className="text-red-600 hover:text-red-700">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-sm font-medium ${getScoreColor(result.overall_score || result.percentage || 0)}`}>
                      {result.overall_score || result.percentage || 0}%
                    </span>
                    <button
                      onClick={() => handleEditScore(resultId, result.overall_score || result.percentage || 0)}
                      className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="col-span-2 flex items-center space-x-2">
                {getStatusIcon(result.status)}
                <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                  {result.status.replace("_", " ")}
                </span>
              </div>

              {/* Confidence */}
              <div className="col-span-2 flex items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">{result.accuracy || 0}%</span>
              </div>

              {/* Date */}
              <div className="col-span-1 flex items-center">
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {result.created_at ? formatDate(result.created_at) : result.processed_at ? formatDate(result.processed_at) : "N/A"}
                </span>
              </div>

              {/* Actions */}
              <div className="col-span-1 flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem key={`preview-${resultId}`}>
                      <Play className="w-4 h-4 mr-2" />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem key={`edit-${resultId}`}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem key={`export-${resultId}`}>
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </DropdownMenuItem>
                    <DropdownMenuItem key={`reprocess-${resultId}`}>
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reprocess
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
