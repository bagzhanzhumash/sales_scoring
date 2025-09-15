"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Edit3, Download, MoreVertical, Calendar, User, Clock, Target } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EditProjectModal } from "./edit-project-modal"
import type { Project, AudioFile, AnalysisResult } from "@/types/projects"

interface ProjectHeaderProps {
  project: Project
  files: AudioFile[]
  results: AnalysisResult[]
}

export function ProjectHeader({ project, files, results }: ProjectHeaderProps) {
  const [editModalOpen, setEditModalOpen] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400"
      case "active":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
      case "pending":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400"
      case "failed":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-900/20 dark:text-slate-400"
    }
  }

  const getProgressPercentage = () => {
    if (files.length === 0) return 0
    const completed = files.filter((f) => f.status === "completed").length
    return Math.round((completed / files.length) * 100)
  }

  const getAverageAccuracy = () => {
    if (!results || !Array.isArray(results) || results.length === 0) return 0
    // Backend returns results with 'percentage' field, not 'accuracy'
    const total = results.reduce((sum, r) => sum + (r.percentage || 0), 0)
    return Math.round(total / results.length)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const metrics = [
    {
      label: "Status",
      value: project.status.charAt(0).toUpperCase() + project.status.slice(1),
      icon: <Target className="w-5 h-5" />,
      color: getStatusColor(project.status),
    },
    {
      label: "Progress",
      value: `${files.filter((f) => f.status === "completed").length}/${files.length} Files`,
      icon: <Clock className="w-5 h-5" />,
      color: "bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400",
      progress: getProgressPercentage(),
    },
    {
      label: "Accuracy",
      value: `${getAverageAccuracy()}%`,
      icon: <Target className="w-5 h-5" />,
      color: "bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400",
    },
    {
      label: "Total Files",
      value: files.length.toString(),
      icon: <Calendar className="w-5 h-5" />,
      color: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400",
    },
  ]

  return (
    <>
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/20">
        {/* Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6">
          <div className="flex-1 mb-4 lg:mb-0">
            <div className="flex items-center space-x-4 mb-3">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{project.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(project.status)}`}>
                {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
              </span>
            </div>

            {project.description && (
              <p className="text-lg text-slate-600 dark:text-slate-400 mb-4 max-w-3xl">{project.description}</p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>Created {formatDate(project.created_at)}</span>
              </div>
              {project.creator_name && (
                <div className="flex items-center space-x-2">
                  <User className="w-4 h-4" />
                  <span>by {project.creator_name}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Updated {formatDate(project.updated_at)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => setEditModalOpen(true)}>
              <Edit3 className="w-4 h-4 mr-2" />
              Edit
            </Button>
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.map((metric, index) => (
            <motion.div
              key={metric.label}
              className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-200 dark:border-slate-700"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="text-slate-600 dark:text-slate-400">{metric.icon}</div>
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">{metric.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-slate-900 dark:text-white">{metric.value}</span>
              </div>
              {metric.progress !== undefined && (
                <div className="mt-3">
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                    <motion.div
                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${metric.progress}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 mt-1">{metric.progress}% complete</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <EditProjectModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        project={project}
        onUpdate={() => {
          // Refresh project data
        }}
      />
    </>
  )
}
