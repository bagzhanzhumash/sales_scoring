"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Upload, Filter, Grid, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { FileUploadModal } from "../modals/file-upload-modal"
import { FileGrid } from "../files/file-grid"
import { FileList } from "../files/file-list"
import { FilesFilters } from "../files/files-filters"
import { BulkFileActions } from "../files/bulk-file-actions"
import type { AudioFile } from "@/types/projects"

interface FilesTabProps {
  projectId: string
  files: AudioFile[]
  isLoading: boolean
  onRefresh: () => void
}

export function FilesTab({ projectId, files, isLoading, onRefresh }: FilesTabProps) {
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [selectedFiles, setSelectedFiles] = useState<string[]>([])
  const [filters, setFilters] = useState({
    status: "all",
    search: "",
    sortBy: "recent",
  })

  const filteredFiles = files.filter((file) => {
    if (filters.status !== "all" && file.status !== filters.status) return false
    if (filters.search && !file.name.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  })

  const handleSelectFile = (fileId: string, selected: boolean) => {
    if (selected) {
      setSelectedFiles([...selectedFiles, fileId])
    } else {
      setSelectedFiles(selectedFiles.filter((id) => id !== fileId))
    }
  }

  const handleSelectAll = () => {
    if (selectedFiles.length === filteredFiles.length) {
      setSelectedFiles([])
    } else {
      setSelectedFiles(filteredFiles.map((f) => f.id))
    }
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-4">
            <Button onClick={() => setUploadModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Upload className="w-4 h-4 mr-2" />
              Upload Files
            </Button>
            {selectedFiles.length > 0 && (
              <span className="text-sm text-slate-600 dark:text-slate-400">
                {selectedFiles.length} file{selectedFiles.length !== 1 ? "s" : ""} selected
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}>
              {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </Button>
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Filters */}
        <FilesFilters filters={filters} onFiltersChange={setFilters} files={files} />

        {/* Bulk Actions */}
        {selectedFiles.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <BulkFileActions
              selectedFiles={selectedFiles}
              onClearSelection={() => setSelectedFiles([])}
              projectId={projectId}
            />
          </motion.div>
        )}

        {/* Files Display */}
        <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="text-center py-12">
              <Upload className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">No files found</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Upload audio files to start analyzing them with your checklist.
              </p>
              <Button onClick={() => setUploadModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
                <Upload className="w-4 h-4 mr-2" />
                Upload First File
              </Button>
            </div>
          ) : viewMode === "grid" ? (
            <FileGrid
              files={filteredFiles}
              selectedFiles={selectedFiles}
              onSelectFile={handleSelectFile}
              onSelectAll={handleSelectAll}
            />
          ) : (
            <FileList
              files={filteredFiles}
              selectedFiles={selectedFiles}
              onSelectFile={handleSelectFile}
              onSelectAll={handleSelectAll}
            />
          )}
        </div>
      </div>

      <FileUploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        projectId={projectId}
        onUploadComplete={onRefresh}
      />
    </>
  )
}
