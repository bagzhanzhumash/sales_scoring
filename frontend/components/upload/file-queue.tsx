"use client"

import { motion, AnimatePresence } from "framer-motion"
import { FileQueueItem } from "./file-queue-item"
import type { UploadingFile } from "@/types/upload"

interface FileQueueProps {
  files: UploadingFile[]
  onPause: (fileId: string) => void
  onResume: (fileId: string) => void
  onCancel: (fileId: string) => void
  onRetry: (fileId: string) => void
}

export function FileQueue({ files, onPause, onResume, onCancel, onRetry }: FileQueueProps) {
  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Upload Queue</h3>
        <span className="text-sm text-slate-600 dark:text-slate-400">
          {files.length} file{files.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-4">
        <AnimatePresence>
          {files.map((file, index) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <FileQueueItem
                file={file}
                onPause={() => onPause(file.id)}
                onResume={() => onResume(file.id)}
                onCancel={() => onCancel(file.id)}
                onRetry={() => onRetry(file.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}
