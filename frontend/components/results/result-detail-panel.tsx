"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { X, Edit2, Save, Play, Download, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AnalysisResult } from "@/types/projects"

interface ResultDetailPanelProps {
  result: AnalysisResult
  onClose: () => void
  onEdit: (updates: Partial<AnalysisResult>) => void
  onOpenScoring?: (result: AnalysisResult) => void
}

export function ResultDetailPanel({ result, onClose, onEdit, onOpenScoring }: ResultDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedScore, setEditedScore] = useState(result.overall_score)
  const [notes, setNotes] = useState(result.notes || "")

  const handleSave = () => {
    onEdit({
      overall_score: editedScore,
      notes,
    })
    setIsEditing(false)
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-600"
    if (score >= 60) return "text-amber-600"
    return "text-red-600"
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 h-fit"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate" title={result.file_name}>
          {result.file_name}
        </h3>
        <div className="flex items-center space-x-2">
          {isEditing ? (
            <>
              <Button size="sm" onClick={handleSave}>
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
              <Edit2 className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Overall Score */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Overall Score</h4>
          {isEditing ? (
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={editedScore}
                onChange={(e) => setEditedScore(Number(e.target.value))}
                className="w-20 px-3 py-2 border border-slate-300 rounded-lg"
                min="0"
                max="100"
              />
              <span className="text-sm text-slate-600">%</span>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <span className={`text-3xl font-bold ${getScoreColor(result.overall_score || 0)}`}>
                {result.overall_score || 0}%
              </span>
              <span className="text-sm text-slate-600 dark:text-slate-400">{result.accuracy}% confidence</span>
            </div>
          )}
        </div>

        {/* Criteria Breakdown */}
        {result.criteria_scores && (
          <div>
            <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Criteria Breakdown</h4>
            <div className="space-y-3">
              {Object.entries(result.criteria_scores).map(([criterion, score]) => (
                <div key={criterion} className="flex items-center justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">
                    {criterion.replace("_", " ")}
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="w-20 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500"
                        }`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium ${getScoreColor(score)}`}>{score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Notes</h4>
          {isEditing ? (
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg resize-none"
              rows={4}
              placeholder="Add notes about this result..."
            />
          ) : (
            <div className="text-sm text-slate-600 dark:text-slate-400">{notes || "No notes added"}</div>
          )}
        </div>

        {/* Metadata */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Metadata</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Status:</span>
              <span className="capitalize">{result.status.replace("_", " ")}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Created:</span>
              <span>{result.created_at ? new Date(result.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              }) : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Updated:</span>
              <span>{result.updated_at ? new Date(result.updated_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              }) : 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2">
          <Button className="w-full" variant="outline">
            <Play className="w-4 h-4 mr-2" />
            Preview Audio
          </Button>
          <Button 
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700"
            onClick={() => onOpenScoring?.(result)}
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Open Scoring Interface
          </Button>
          <Button className="w-full" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Result
          </Button>
          <Button className="w-full" variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reprocess
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
