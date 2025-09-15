"use client"

import { Download, Edit2, RotateCcw, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BulkResultsActionsProps {
  selectedResults: string[]
  onClearSelection: () => void
  projectId: string
}

export function BulkResultsActions({ selectedResults, onClearSelection, projectId }: BulkResultsActionsProps) {
  return (
    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {selectedResults.length} result{selectedResults.length !== 1 ? "s" : ""} selected
          </span>
          <button
            onClick={onClearSelection}
            className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            Clear selection
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <Button size="sm" variant="outline">
            <Edit2 className="w-4 h-4 mr-2" />
            Bulk Edit
          </Button>
          <Button size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" variant="outline">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reprocess
          </Button>
          <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete
          </Button>
          <Button size="sm" variant="ghost" onClick={onClearSelection}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
