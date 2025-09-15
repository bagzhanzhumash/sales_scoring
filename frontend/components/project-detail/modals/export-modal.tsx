"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Download, FileText, Table, BarChart3 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  selectedResults: string[]
}

export function ExportModal({ isOpen, onClose, projectId, selectedResults }: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<"csv" | "xlsx" | "pdf" | "json">("csv")
  const [includeTranscriptions, setIncludeTranscriptions] = useState(true)
  const [includeCriteria, setIncludeCriteria] = useState(true)
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // TODO: Implement actual export API call
      console.log("Exporting:", {
        projectId,
        selectedResults,
        format: exportFormat,
        includeTranscriptions,
        includeCriteria,
      })

      // Simulate export delay
      await new Promise((resolve) => setTimeout(resolve, 2000))

      onClose()
    } catch (error) {
      console.error("Export failed:", error)
    } finally {
      setIsExporting(false)
    }
  }

  const formatOptions = [
    { value: "csv", label: "CSV", icon: Table, description: "Comma-separated values for spreadsheets" },
    { value: "xlsx", label: "Excel", icon: BarChart3, description: "Microsoft Excel workbook" },
    { value: "pdf", label: "PDF", icon: FileText, description: "Formatted report document" },
    { value: "json", label: "JSON", icon: FileText, description: "Structured data format" },
  ]

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg">
                  <Download className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Export Results</h2>
              </div>
              <button
                onClick={onClose}
                disabled={isExporting}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="space-y-6">
              {/* Export Info */}
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {selectedResults.length > 0
                    ? `Exporting ${selectedResults.length} selected result${selectedResults.length !== 1 ? "s" : ""}`
                    : "Exporting all results from this project"}
                </p>
              </div>

              {/* Format Selection */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Export Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {formatOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setExportFormat(option.value as any)}
                      className={`p-3 border rounded-lg text-left transition-all ${
                        exportFormat === option.value
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-slate-200 dark:border-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        <option.icon className="w-4 h-4" />
                        <span className="font-medium text-slate-900 dark:text-white">{option.label}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400">{option.description}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  Include Data
                </label>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={includeCriteria}
                      onChange={(e) => setIncludeCriteria(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Criteria breakdown scores</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={includeTranscriptions}
                      onChange={(e) => setIncludeTranscriptions(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Full transcriptions</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex space-x-3 pt-6">
              <Button variant="outline" onClick={onClose} disabled={isExporting} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isExporting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
