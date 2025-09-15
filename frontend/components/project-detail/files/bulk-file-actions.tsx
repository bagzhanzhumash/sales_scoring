"use client"

import { Play, Trash2, Download, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BulkFileActionsProps {
  selectedFiles: string[]
  onClearSelection: () => void
  projectId: string
}

export function BulkFileActions({ selectedFiles, onClearSelection, projectId }: BulkFileActionsProps) {
  return (
    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
            {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected
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
            <Play className="w-4 h-4 mr-2" />
            Process
          </Button>
          <Button size="sm" variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Download
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
