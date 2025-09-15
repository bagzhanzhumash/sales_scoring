"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { useQuery } from "@tanstack/react-query"
import { projectsApi } from "@/lib/api/projects-api"
import { UploadBreadcrumb } from "./upload-breadcrumb"
import { UploadHeader } from "./upload-header"
import { UploadZone } from "./upload-zone"
import { FileQueue } from "./file-queue"
import { BulkActions } from "./bulk-actions"
import { UploadSettings } from "./upload-settings"
import { ProjectSelector } from "./project-selector"
import { useUploadManager } from "@/hooks/use-upload-manager"
import type { Project, UploadSettings as UploadSettingsType } from "@/types/upload"

interface UploadClientProps {
  projectId?: string
  initialProject?: Project
}

export function UploadClient({ projectId, initialProject }: UploadClientProps) {
  const [selectedProjectId, setSelectedProjectId] = useState(projectId)
  const [settings, setSettings] = useState<UploadSettingsType>({
    checklistId: initialProject?.checklist_id,
    model: "gpt-4",
    autoProcess: true,
    confidenceThreshold: 80,
    notifyOnComplete: true,
  })

  const { data: projects } = useQuery({
    queryKey: ["projects"],
    queryFn: () => projectsApi.getProjects({ limit: 100 }),
  })

  const {
    uploads,
    globalProgress,
    addFiles,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    clearCompleted,
    clearAll,
  } = useUploadManager()

  const handleFilesSelected = (files: FileList) => {
    if (!selectedProjectId) {
      // Show project selection modal or error
      return
    }
    addFiles(files, { ...settings, projectId: selectedProjectId })
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  return (
    <motion.div
      className="container mx-auto px-4 py-8 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Breadcrumb */}
      <motion.div variants={itemVariants}>
        <UploadBreadcrumb projectId={selectedProjectId} project={initialProject} />
      </motion.div>

      {/* Header */}
      <motion.div variants={itemVariants}>
        <UploadHeader />
      </motion.div>

      {/* Project Selector (if not in project context) */}
      {!projectId && (
        <motion.div variants={itemVariants}>
          <ProjectSelector
            selectedProjectId={selectedProjectId}
            onProjectChange={setSelectedProjectId}
            projects={projects?.projects || []}
          />
        </motion.div>
      )}

      {/* Upload Zone */}
      <motion.div variants={itemVariants}>
        <UploadZone
          onFilesSelected={handleFilesSelected}
          disabled={!selectedProjectId}
          acceptedFormats={["audio/mpeg", "audio/wav", "audio/mp4", "audio/x-m4a", "audio/ogg"]}
          maxFileSize={500 * 1024 * 1024} // 500MB
        />
      </motion.div>

      {/* Upload Settings */}
      <motion.div variants={itemVariants}>
        <UploadSettings settings={settings} onSettingsChange={setSettings} />
      </motion.div>

      {/* File Queue */}
      {uploads.length > 0 && (
        <motion.div
          variants={itemVariants}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <FileQueue
            files={uploads}
            onPause={pauseUpload}
            onResume={resumeUpload}
            onCancel={cancelUpload}
            onRetry={retryUpload}
          />
        </motion.div>
      )}

      {/* Bulk Actions */}
      {uploads.length > 0 && (
        <motion.div
          variants={itemVariants}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
        >
          <BulkActions
            files={uploads}
            globalProgress={globalProgress}
            onClearCompleted={clearCompleted}
            onClearAll={clearAll}
          />
        </motion.div>
      )}
    </motion.div>
  )
}
