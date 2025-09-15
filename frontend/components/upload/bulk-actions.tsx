"use client"

import { Pause, Trash2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { UploadingFile } from "@/types/upload"

interface BulkActionsProps {
  files: UploadingFile[]
  globalProgress: number
  onClearCompleted: () => void
  onClearAll: () => void
}

export function BulkActions({ files, globalProgress, onClearCompleted, onClearAll }: BulkActionsProps) {
  const completedCount = files.filter((f) => f.status === "completed").length
  const uploadingCount = files.filter((f) => f.status === "uploading").length
  const failedCount = files.filter((f) => f.status === "failed").length

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Progress Summary */}
        <div className="space-y-2">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Upload Progress</h3>
            <span className="text-sm text-slate-600 dark:text-slate-400">
              {completedCount} of {files.length} completed
            </span>
          </div>

          {files.length > 0 && (
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${globalProgress}%` }}
              />
            </div>
          )}

          <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
            {uploadingCount > 0 && <span>🔄 {uploadingCount} uploading</span>}
            {completedCount > 0 && <span>✅ {completedCount} completed</span>}
            {failedCount > 0 && <span>❌ {failedCount} failed</span>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          {uploadingCount > 0 && (
            <Button variant="outline" size="sm">
              <Pause className="w-4 h-4 mr-2" />
              Pause All
            </Button>
          )}

          {completedCount > 0 && (
            <Button variant="outline" size="sm" onClick={onClearCompleted}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Clear Completed
            </Button>
          )}

          <Button variant="outline" size="sm" onClick={onClearAll} className="text-red-600 hover:text-red-700">
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        </div>
      </div>
    </div>
  )
}
