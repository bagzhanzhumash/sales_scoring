"use client"

import { useState, useEffect } from "react"
import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { Plus } from "lucide-react"
import { useProjectsStore } from "@/store/projects-store"
import { projectsApi } from "@/lib/api/projects-api"
import { ProjectsHeader } from "./projects-header"
import { ProjectsStats } from "./projects-stats"
import { ProjectsFilters } from "./projects-filters"
import { BulkActionsBar } from "./bulk-actions-bar"
import { ProjectsGrid } from "./projects-grid"
import { CreateProjectModal } from "./create-project-modal"
import { ProjectsSkeleton } from "./projects-skeleton"
import { ProjectsError } from "./projects-error"
import { Button } from "@/components/ui/button"
import type { ProjectListResponse, ProjectStats } from "@/types/projects"

interface ProjectsClientProps {
  initialData: ProjectListResponse | null
  initialStats: ProjectStats | null
  initialFilters: {
    status: string
    search: string
    page: number
  }
}

export function ProjectsClient({ initialData, initialStats, initialFilters }: ProjectsClientProps) {
  const [createModalOpen, setCreateModalOpen] = useState(false)

  const { filters, searchTerm, selectedIds, setFilters, setSearchTerm, clearSelection, setInitialFilters } =
    useProjectsStore()

  // Initialize filters from URL params
  useEffect(() => {
    setInitialFilters(initialFilters)
  }, [initialFilters, setInitialFilters])

  const {
    data: projectsData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["projects", filters, searchTerm],
    queryFn: () => projectsApi.getProjects({ ...filters, search: searchTerm }),
    initialData,
    refetchInterval: 60000, // 60 seconds
    retry: 3,
  })

  const { data: statsData } = useQuery({
    queryKey: ["projects", "stats"],
    queryFn: projectsApi.getProjectStats,
    initialData: initialStats,
    refetchInterval: 300000, // 5 minutes
  })

  if (error && !initialData) {
    return <ProjectsError onRetry={() => refetch()} />
  }

  if (isLoading && !initialData) {
    return <ProjectsSkeleton />
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
      {/* Header */}
      <motion.div variants={itemVariants}>
        <ProjectsHeader />
      </motion.div>

      {/* Page Title & Create Button */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Projects</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your speech analysis projects and audio files</p>
        </div>
        <Button
          onClick={() => setCreateModalOpen(true)}
          className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          <Plus className="w-5 h-5 mr-2" />
          Create Project
        </Button>
      </motion.div>

      {/* Stats Summary */}
      <motion.div variants={itemVariants}>
        <ProjectsStats stats={statsData} />
      </motion.div>

      {/* Filters & Search */}
      <motion.div variants={itemVariants}>
        <ProjectsFilters totalCount={projectsData?.total || 0} filteredCount={projectsData?.projects?.length || 0} />
      </motion.div>

      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <motion.div
          variants={itemVariants}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
        >
          <BulkActionsBar />
        </motion.div>
      )}

      {/* Projects Grid */}
      <motion.div variants={itemVariants}>
        <ProjectsGrid
          projects={projectsData?.projects || []}
          isLoading={isLoading}
          hasMore={projectsData?.has_next || false}
          onLoadMore={() => {
            // Implement pagination
          }}
        />
      </motion.div>

      {/* Create Project Modal */}
      <CreateProjectModal isOpen={createModalOpen} onClose={() => setCreateModalOpen(false)} />
    </motion.div>
  )
}
