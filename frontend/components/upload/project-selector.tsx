"use client"

import { useState } from "react"
import { ChevronDown, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Project } from "@/types/upload"

interface ProjectSelectorProps {
  selectedProjectId?: string
  onProjectChange: (projectId: string) => void
  projects: Project[]
}

export function ProjectSelector({ selectedProjectId, onProjectChange, projects }: ProjectSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState("")

  const selectedProject = projects.find((p) => p.id === selectedProjectId)
  const filteredProjects = projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Select Project</h3>
        <Button variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between p-3 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span className={selectedProject ? "text-slate-900 dark:text-white" : "text-slate-500"}>
            {selectedProject ? selectedProject.name : "Choose a project..."}
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-10 max-h-64 overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search projects..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Project List */}
            <div className="max-h-48 overflow-y-auto">
              {filteredProjects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => {
                    onProjectChange(project.id)
                    setIsOpen(false)
                  }}
                  className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="font-medium text-slate-900 dark:text-white">{project.name}</div>
                  {project.description && (
                    <div className="text-sm text-slate-600 dark:text-slate-400 truncate">{project.description}</div>
                  )}
                  {project.file_count !== undefined && (
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{project.file_count} files</div>
                  )}
                </button>
              ))}
              {filteredProjects.length === 0 && (
                <div className="p-3 text-center text-slate-500 dark:text-slate-400">No projects found</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
