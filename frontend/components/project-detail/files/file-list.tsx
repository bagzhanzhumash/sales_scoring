"use client"

import { FileAudio, Play, Pause, Download, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu"
import type { AudioFile } from "@/types/projects"

interface FileListProps {
  files: AudioFile[]
  selectedFiles: string[]
  onSelectFile: (fileId: string, selected: boolean) => void
  onSelectAll: () => void
}

export function FileList({ files, selectedFiles, onSelectFile, onSelectAll }: FileListProps) {
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
      <div className="flex items-center space-x-4 pb-2 border-b border-slate-200 dark:border-slate-700">
        <input
          type="checkbox"
          checked={selectedFiles.length === files.length && files.length > 0}
          onChange={onSelectAll}
          className="w-4 h-4 text-blue-600 rounded"
        />
        <div className="flex-1 grid grid-cols-12 gap-4 text-sm font-medium text-slate-600 dark:text-slate-400">
          <div className="col-span-4">Name</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Size</div>
          <div className="col-span-2">Duration</div>
          <div className="col-span-2">Actions</div>
        </div>
      </div>

      {/* File List */}
      <div className="space-y-2">
        {files.map((file) => (
          <div
            key={file.id}
            className={`flex items-center space-x-4 p-3 rounded-lg border transition-all ${
              selectedFiles.includes(file.id)
                ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
            }`}
          >
            <input
              type="checkbox"
              checked={selectedFiles.includes(file.id)}
              onChange={(e) => onSelectFile(file.id, e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />

            <div className="flex-1 grid grid-cols-12 gap-4 items-center">
              {/* Name */}
              <div className="col-span-4 flex items-center space-x-3">
                <FileAudio className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <span className="font-medium text-slate-900 dark:text-white truncate" title={file.name}>
                  {file.name}
                </span>
              </div>

              {/* Status */}
              <div className="col-span-2 flex items-center space-x-2">
                {getStatusIcon(file.status)}
                <span className="text-sm text-slate-600 dark:text-slate-400 capitalize">{file.status}</span>
              </div>

              {/* Size */}
              <div className="col-span-2 text-sm text-slate-600 dark:text-slate-400">{formatFileSize(file.size)}</div>

              {/* Duration */}
              <div className="col-span-2 text-sm text-slate-600 dark:text-slate-400">
                {formatDuration(file.duration)}
              </div>

              {/* Actions */}
              <div className="col-span-2 flex items-center space-x-2">
                {file.status === "processing" && (
                  <Button size="sm" variant="outline">
                    <Pause className="w-3 h-3" />
                  </Button>
                )}
                {file.status === "completed" && (
                  <Button size="sm" variant="outline">
                    <Play className="w-3 h-3" />
                  </Button>
                )}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <MoreVertical className="w-3 h-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Progress Bar (if processing) */}
            {file.status === "processing" && file.progress && (
              <div className="col-span-12 mt-2">
                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
                  <span>Processing</span>
                  <span>{file.progress}%</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-1">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-1 rounded-full transition-all duration-300"
                    style={{ width: `${file.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
