"use client"
import { motion } from "framer-motion"
import { Play, Pause, Download, MoreVertical, FileAudio } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import type { AudioFile } from "@/types/projects"

interface FileGridProps {
  files: AudioFile[]
  selectedFiles: string[]
  onSelectFile: (fileId: string, selected: boolean) => void
  onSelectAll: () => void
}

export function FileGrid({ files, selectedFiles, onSelectFile, onSelectAll }: FileGridProps) {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <div className="w-3 h-3 bg-emerald-500 rounded-full" />
      case "processing":
        return <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
      case "pending":
        return <div className="w-3 h-3 bg-amber-500 rounded-full" />
      case "failed":
        return <div className="w-3 h-3 bg-red-500 rounded-full" />
      default:
        return <div className="w-3 h-3 bg-slate-400 rounded-full" />
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"]
    if (bytes === 0) return "0 Bytes"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "Unknown"
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={selectedFiles.length === files.length && files.length > 0}
            onChange={onSelectAll}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {selectedFiles.length > 0 ? `${selectedFiles.length} selected` : "Select all"}
          </span>
        </div>
        <span className="text-sm text-slate-600 dark:text-slate-400">{files.length} files</span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {files.map((file, index) => (
          <motion.div
            key={file.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className={`bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border transition-all ${
              selectedFiles.includes(file.id)
                ? "border-blue-500 ring-2 ring-blue-500/20"
                : "border-slate-200 dark:border-slate-700 hover:border-slate-300"
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start space-x-3 flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={selectedFiles.includes(file.id)}
                  onChange={(e) => onSelectFile(file.id, e.target.checked)}
                  className="mt-1 w-4 h-4 text-blue-600 rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <FileAudio className="w-4 h-4 text-slate-500 flex-shrink-0" />
                    {getStatusIcon(file.status)}
                  </div>
                  <h3 className="font-medium text-slate-900 dark:text-white truncate" title={file.name}>
                    {file.name}
                  </h3>
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
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </DropdownMenuItem>
                  <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Progress Bar (if processing) */}
            {file.status === "processing" && file.progress && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                  <span>Processing</span>
                  <span>{file.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* File Info */}
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center justify-between">
                <span>Size</span>
                <span>{formatFileSize(file.size)}</span>
              </div>
              {file.duration && (
                <div className="flex items-center justify-between">
                  <span>Duration</span>
                  <span>{formatDuration(file.duration)}</span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span>Status</span>
                <span className="capitalize">{file.status}</span>
              </div>
            </div>

            {/* Error Message */}
            {file.status === "failed" && file.error_message && (
              <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
                {file.error_message}
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-2 mt-3">
              {file.status === "processing" && (
                <Button size="sm" variant="outline" className="flex-1">
                  <Pause className="w-3 h-3 mr-1" />
                  Pause
                </Button>
              )}
              {file.status === "failed" && (
                <Button size="sm" variant="outline" className="flex-1">
                  Retry
                </Button>
              )}
              {file.status === "completed" && (
                <Button size="sm" variant="outline" className="flex-1">
                  <Play className="w-3 h-3 mr-1" />
                  Preview
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
