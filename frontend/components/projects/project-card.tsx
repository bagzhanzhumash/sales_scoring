"use client"

import type React from "react"

import { useState } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import {
  MoreVertical,
  Eye,
  Upload,
  FileText,
  Copy,
  Archive,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle,
  XCircle,
  User,
} from "lucide-react"
import { useProjectsStore } from "@/store/projects-store"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import type { Project } from "@/types/projects"

interface ProjectCardProps {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  const router = useRouter()
  const { selectedIds, toggleSelection } = useProjectsStore()
  const [isHovered, setIsHovered] = useState(false)

  const isSelected = selectedIds.includes(project.id)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case "active":
        return <Clock className="w-4 h-4 text-blue-500" />
      case "pending":
        return <AlertCircle className="w-4 h-4 text-amber-500" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-slate-500" />
    }
  }

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
    // Use backend field names with fallback to legacy names
    const totalFiles = project.total_files || project.audio_files_count || 0
    const completedFiles = project.processed_files || project.completed_files_count || 0
    if (totalFiles === 0) return 0
    return Math.round((completedFiles / totalFiles) * 100)
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

    if (diffInDays === 0) return "Today"
    if (diffInDays === 1) return "Yesterday"
    if (diffInDays < 7) return `${diffInDays}d ago`
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, input, [role="menuitem"]')) {
      return
    }
    router.push(`/projects/${project.id}`)
  }

  const handleCheckboxChange = (e: React.MouseEvent) => {
    e.stopPropagation()
    toggleSelection(project.id)
  }

  return (
    <motion.div
      className={`bg-white/95 backdrop-blur-xl rounded-xl p-6 shadow-xl border transition-all duration-200 cursor-pointer group ${
        isSelected
          ? "border-blue-500 ring-2 ring-blue-500/20"
          : "border-white/20 hover:border-blue-200 hover:shadow-2xl"
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-3 flex-1">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation()
              toggleSelection(project.id)
            }}
            onClick={handleCheckboxChange}
            className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white truncate group-hover:text-blue-600 transition-colors">
              {project.name}
            </h3>
            {project.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 line-clamp-2">{project.description}</p>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}`)}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}/upload`)}>
              <Upload className="w-4 h-4 mr-2" />
              Upload Files
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push(`/projects/${project.id}/results`)}>
              <FileText className="w-4 h-4 mr-2" />
              View Results
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Copy className="w-4 h-4 mr-2" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Archive className="w-4 h-4 mr-2" />
              Archive
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status and Date */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          {getStatusIcon(project.status)}
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(project.status)}`}>
            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
          </span>
        </div>
        <span className="text-sm text-slate-600 dark:text-slate-400">{formatDate(project.created_at)}</span>
      </div>

      {/* Files Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
        <div>
          <p className="text-lg font-bold text-slate-900 dark:text-white">
            {project.total_files || project.audio_files_count || 0}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">Files</p>
        </div>
        <div>
          <p className="text-lg font-bold text-emerald-600">
            {project.processed_files || project.completed_files_count || 0}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">Completed</p>
        </div>
        <div>
          <p className="text-lg font-bold text-amber-600">
            {(() => {
              const totalFiles = project.total_files || project.audio_files_count || 0
              const completedFiles = project.processed_files || project.completed_files_count || 0
              return Math.max(0, totalFiles - completedFiles)
            })()}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400">Pending</p>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Progress</span>
          <span className="text-sm text-slate-600 dark:text-slate-400">{getProgressPercentage()}%</span>
        </div>
        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getProgressPercentage()}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600 dark:text-slate-400">{project.creator_name || "Unknown"}</span>
        </div>
        {(project.average_score || project.average_accuracy) && (
          <div className="text-sm font-medium text-slate-900 dark:text-white">
            {Math.round(project.average_score || project.average_accuracy || 0)}% score
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div
        className={`flex space-x-2 mt-4 transition-all duration-200 ${
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        }`}
      >
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/projects/${project.id}`)
          }}
          className="flex-1"
        >
          View Details
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation()
            router.push(`/projects/${project.id}/upload`)
          }}
          className="flex-1"
        >
          Upload Files
        </Button>
      </div>
    </motion.div>
  )
}
