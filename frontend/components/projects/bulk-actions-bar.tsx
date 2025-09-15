"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { X, Trash2, Archive, Download, RefreshCw, Copy } from "lucide-react"
import { useProjectsStore } from "@/store/projects-store"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"

export function BulkActionsBar() {
  const { selectedIds, clearSelection } = useProjectsStore()
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleBulkAction = async (action: string) => {
    setIsProcessing(true)
    try {
      // Implement bulk actions
      console.log(`Bulk ${action} for:`, selectedIds)

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      clearSelection()
    } catch (error) {
      console.error(`Bulk ${action} failed:`, error)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-blue-600 rounded-sm flex items-center justify-center">
                <span className="text-white text-xs font-bold">✓</span>
              </div>
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {selectedIds.length} project{selectedIds.length !== 1 ? "s" : ""} selected
              </span>
            </div>

            <button
              onClick={clearSelection}
              className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              Clear selection
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => handleBulkAction("duplicate")} disabled={isProcessing}>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </Button>

            <Button variant="outline" size="sm" onClick={() => handleBulkAction("export")} disabled={isProcessing}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>

            <Button variant="outline" size="sm" onClick={() => handleBulkAction("reprocess")} disabled={isProcessing}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reprocess
            </Button>

            <Button variant="outline" size="sm" onClick={() => handleBulkAction("archive")} disabled={isProcessing}>
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isProcessing}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>

            <button onClick={clearSelection} className="p-2 text-slate-400 hover:text-slate-600 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          handleBulkAction("delete")
          setShowDeleteConfirm(false)
        }}
        title="Delete Projects"
        description={`Are you sure you want to delete ${selectedIds.length} project${selectedIds.length !== 1 ? "s" : ""}? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="destructive"
      />
    </>
  )
}
