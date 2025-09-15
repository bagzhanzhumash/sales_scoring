"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { FolderPlus } from "lucide-react"
import { ProjectCard } from "./project-card"
import { Button } from "@/components/ui/button"
import type { Project } from "@/types/projects"

interface ProjectsGridProps {
  projects: Project[]
  isLoading: boolean
  hasMore: boolean
  onLoadMore: () => void
}

export function ProjectsGrid({ projects, isLoading, hasMore, onLoadMore }: ProjectsGridProps) {
  const [loadingMore, setLoadingMore] = useState(false)

  const handleLoadMore = async () => {
    setLoadingMore(true)
    await onLoadMore()
    setLoadingMore(false)
  }

  if (projects.length === 0 && !isLoading) {
    return (
      <div className="text-center py-16">
        <FolderPlus className="w-16 h-16 text-slate-400 mx-auto mb-6" />
        <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-2">No projects found</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
          Create your first project to start analyzing audio files with AI-powered checklists.
        </p>
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
          <FolderPlus className="w-5 h-5 mr-2" />
          Create First Project
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Projects Grid */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {projects.map((project, index) => (
          <motion.div
            key={project.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <ProjectCard project={project} />
          </motion.div>
        ))}
      </motion.div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center">
          <Button onClick={handleLoadMore} disabled={loadingMore} variant="outline" size="lg">
            {loadingMore ? (
              <>
                <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin mr-2" />
                Loading...
              </>
            ) : (
              "Load More Projects"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
