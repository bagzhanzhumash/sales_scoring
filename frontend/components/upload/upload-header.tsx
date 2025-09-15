"use client"

import { Upload } from "lucide-react"

export function UploadHeader() {
  return (
    <div className="text-center space-y-4">
      <div className="flex items-center justify-center space-x-3">
        <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
          <Upload className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Upload Audio Files</h1>
      </div>
      <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
        Drag & drop your audio files or click to browse. Files will be automatically processed with your selected
        checklist.
      </p>
    </div>
  )
}
