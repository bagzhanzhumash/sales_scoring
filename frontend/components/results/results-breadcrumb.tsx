"use client"

import { ChevronRight, Home, BarChart3, Folder } from "lucide-react"
import { useRouter } from "next/navigation"
import type { Project } from "@/types/projects"

interface ResultsBreadcrumbProps {
  projectId?: string
  project?: Project
}

export function ResultsBreadcrumb({ projectId, project }: ResultsBreadcrumbProps) {
  const router = useRouter()

  return (
    <nav className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
      <button
        onClick={() => router.push("/")}
        className="flex items-center hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
      >
        <Home className="w-4 h-4 mr-1" />
        Dashboard
      </button>
      <ChevronRight className="w-4 h-4" />

      {projectId && project ? (
        <>
          <button
            onClick={() => router.push("/projects")}
            className="flex items-center hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            <Folder className="w-4 h-4 mr-1" />
            Projects
          </button>
          <ChevronRight className="w-4 h-4" />
          <button
            onClick={() => router.push(`/projects/${projectId}`)}
            className="hover:text-slate-900 dark:hover:text-slate-200 transition-colors truncate max-w-xs"
          >
            {project.name}
          </button>
          <ChevronRight className="w-4 h-4" />
        </>
      ) : (
        <>
          <button
            onClick={() => router.push("/projects")}
            className="flex items-center hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
          >
            <Folder className="w-4 h-4 mr-1" />
            Projects
          </button>
          <ChevronRight className="w-4 h-4" />
        </>
      )}

      <span className="text-slate-900 dark:text-slate-200 font-medium flex items-center">
        <BarChart3 className="w-4 h-4 mr-1" />
        Results
      </span>
    </nav>
  )
}
