"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { useRouter, useSearchParams } from "next/navigation"
import { motion } from "framer-motion"
import { projectsApi } from "@/lib/api/projects-api"
import { useProjectWebSocket } from "@/hooks/use-project-websocket"
import { ProjectHeader } from "./project-header"
import { ProjectBreadcrumb } from "./project-breadcrumb"
import { TabNavigation } from "./tab-navigation"
import { OverviewTab } from "./tabs/overview-tab"
import { FilesTab } from "./tabs/files-tab"
import { ResultsTab } from "./tabs/results-tab"
import { ScoringTab } from "./tabs/scoring-tab"
import { ChecklistTab } from "./tabs/checklist-tab"
import { SettingsTab } from "./tabs/settings-tab"
import { FloatingActionButtons } from "./floating-action-buttons"
import { ProjectDetailSkeleton } from "./project-detail-skeleton"
import { ProjectDetailError } from "./project-detail-error"
import type { Project, AudioFile, AnalysisResult, ProjectAnalytics } from "@/types/projects"

interface ProjectDetailClientProps {
  projectId: string
  initialProject: Project
  initialFiles: AudioFile[]
  initialResults: AnalysisResult[]
  initialAnalytics: ProjectAnalytics
  initialTab: string
}

export function ProjectDetailClient({
  projectId,
  initialProject,
  initialFiles,
  initialResults,
  initialAnalytics,
  initialTab,
}: ProjectDetailClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState(initialTab)

  // WebSocket for real-time updates
  const wsUpdates = useProjectWebSocket(projectId)

  // Project data queries
  const {
    data: project,
    isLoading: projectLoading,
    error: projectError,
    refetch: refetchProject,
  } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => projectsApi.getProject(projectId),
    initialData: initialProject,
    refetchInterval: 30000,
  })

  const {
    data: files,
    isLoading: filesLoading,
    refetch: refetchFiles,
  } = useQuery({
    queryKey: ["project-files", projectId],
    queryFn: () => projectsApi.getProjectFiles(projectId),
    initialData: initialFiles,
    refetchInterval: 15000,
  })

  const {
    data: results,
    isLoading: resultsLoading,
    refetch: refetchResults,
  } = useQuery({
    queryKey: ["project-results", projectId],
    queryFn: () => projectsApi.getProjectResults(projectId),
    initialData: initialResults,
    refetchInterval: 30000,
  })

  const { data: analytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ["project-analytics", projectId],
    queryFn: () => projectsApi.getProjectAnalytics(projectId),
    initialData: initialAnalytics,
    refetchInterval: 60000,
  })

  // Update URL when tab changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    if (activeTab === "overview") {
      params.delete("tab")
    } else {
      params.set("tab", activeTab)
    }
    const newUrl = params.toString() ? `?${params.toString()}` : ""
    router.replace(`/projects/${projectId}${newUrl}`, { scroll: false })
  }, [activeTab, projectId, router, searchParams])

  // Handle WebSocket updates
  useEffect(() => {
    if (wsUpdates.length > 0) {
      const latestUpdate = wsUpdates[0]
      switch (latestUpdate.type) {
        case "file_uploaded":
        case "processing_started":
        case "analysis_completed":
          refetchFiles()
          refetchResults()
          refetchAnalytics()
          break
        case "project_updated":
          refetchProject()
          break
      }
    }
  }, [wsUpdates, refetchFiles, refetchResults, refetchAnalytics, refetchProject])

  if (projectError) {
    return <ProjectDetailError onRetry={() => refetchProject()} />
  }

  if (projectLoading) {
    return <ProjectDetailSkeleton />
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
        <ProjectBreadcrumb project={project} />
      </motion.div>

      {/* Project Header */}
      <motion.div variants={itemVariants}>
        <ProjectHeader project={project} files={files} results={results} />
      </motion.div>

      {/* Tab Navigation */}
      <motion.div variants={itemVariants}>
        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          files={files}
          results={results}
          wsUpdates={wsUpdates}
        />
      </motion.div>

      {/* Tab Content */}
      <motion.div variants={itemVariants} className="min-h-[600px]">
        {activeTab === "overview" && (
          <OverviewTab project={project} files={files} results={results} analytics={analytics} wsUpdates={wsUpdates} />
        )}
        {activeTab === "files" && (
          <FilesTab projectId={projectId} files={files} isLoading={filesLoading} onRefresh={refetchFiles} />
        )}
        {activeTab === "results" && (
          <ResultsTab projectId={projectId} results={results} isLoading={resultsLoading} onRefresh={refetchResults} />
        )}
        {activeTab === "scoring" && (
          <ScoringTab projectId={projectId} project={project} files={files} />
        )}
        {activeTab === "checklist" && <ChecklistTab projectId={projectId} project={project} />}
        {activeTab === "settings" && <SettingsTab projectId={projectId} project={project} />}
      </motion.div>

      {/* Floating Action Buttons */}
      <FloatingActionButtons activeTab={activeTab} projectId={projectId} files={files} results={results} />
    </motion.div>
  )
}
