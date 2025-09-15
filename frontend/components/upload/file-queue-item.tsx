"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Play, Pause, X, RotateCcw, FileAudio, Clock, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { UploadingFile } from "@/types/upload"

interface FileQueueItemProps {
  file: UploadingFile
  onPause: () => void
  onResume: () => void
  onCancel: () => void
  onRetry: () => void
}

export function FileQueueItem({ file, onPause, onResume, onCancel, onRetry }: FileQueueItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getStatusIcon = () => {
    switch (file.status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-emerald-500" />
      case "uploading":
      case "processing":
        return <Clock className="w-5 h-5 text-blue-500 animate-spin" />
      case "failed":
        return <AlertCircle className="w-5 h-5 text-red-500" />
      case "cancelled":
        return <X className="w-5 h-5 text-slate-500" />
      default:
        return <Clock className="w-5 h-5 text-slate-400" />
    }
  }

  const getStatusText = () => {
    switch (file.status) {
      case "pending":
        return "Waiting..."
      case "uploading":
        return "Uploading..."
      case "processing":
        return "Processing..."
      case "completed":
        return "Complete ✅"
      case "failed":
        return "Failed"
      case "cancelled":
        return "Cancelled"
      default:
        return "Unknown"
    }
  }

  const formatFileSize = (bytes: number) => {
    const sizes = ["Bytes", "KB", "MB", "GB"]
    if (bytes === 0) return "0 Bytes"
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i]
  }

  const formatTime = (seconds?: number) => {
    if (!seconds || seconds === Number.POSITIVE_INFINITY) return "Unknown"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  return (
    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3 flex-1 min-w-0">
          <FileAudio className="w-5 h-5 text-slate-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-slate-900 dark:text-white truncate" title={file.file.name}>
              {file.file.name}
            </h4>
            <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-400">
              <span>{formatFileSize(file.file.size)}</span>
              {file.metadata?.duration && <span>{formatTime(file.metadata.duration)}</span>}
              <span>{getStatusText()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {getStatusIcon()}

          {/* Action Buttons */}
          <div className="flex items-center space-x-1">
            {file.status === "uploading" && (
              <Button size="sm" variant="outline" onClick={onPause}>
                <Pause className="w-3 h-3" />
              </Button>
            )}
            {file.status === "paused" && (
              <Button size="sm" variant="outline" onClick={onResume}>
                <Play className="w-3 h-3" />
              </Button>
            )}
            {file.status === "failed" && (
              <Button size="sm" variant="outline" onClick={onRetry}>
                <RotateCcw className="w-3 h-3" />
              </Button>
            )}
            {(file.status === "pending" || file.status === "uploading" || file.status === "paused") && (
              <Button size="sm" variant="outline" onClick={onCancel} className="text-red-600">
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {(file.status === "uploading" || file.status === "processing") && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-1">
            <span>
              {formatFileSize(file.uploadedBytes)} / {formatFileSize(file.totalBytes)}
            </span>
            <span>{Math.round(file.progress)}%</span>
          </div>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${file.progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          {file.estimatedTimeRemaining && (
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {formatTime(file.estimatedTimeRemaining)} remaining
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      {file.status === "failed" && file.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-3">
          <p className="text-sm text-red-700 dark:text-red-300">{file.error}</p>
        </div>
      )}

      {/* Settings Preview */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center space-x-4">
          {file.checklistId && <span>📋 Checklist: {file.checklistId}</span>}
          <span>🤖 Auto-process: {file.autoProcess ? "Yes" : "No"}</span>
        </div>
        <button onClick={() => setIsExpanded(!isExpanded)} className="text-blue-600 hover:text-blue-700">
          {isExpanded ? "Less" : "More"}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400"
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <strong>File Details:</strong>
              <ul className="mt-1 space-y-1">
                <li>Type: {file.file.type}</li>
                <li>Size: {formatFileSize(file.file.size)}</li>
                {file.metadata?.duration && <li>Duration: {formatTime(file.metadata.duration)}</li>}
                {file.metadata?.bitrate && <li>Bitrate: {file.metadata.bitrate}</li>}
              </ul>
            </div>
            <div>
              <strong>Processing Settings:</strong>
              <ul className="mt-1 space-y-1">
                <li>Checklist: {file.checklistId || "Default"}</li>
                <li>Auto-process: {file.autoProcess ? "Enabled" : "Disabled"}</li>
                <li>Status: {file.status}</li>
              </ul>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
