"use client"

import type React from "react"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, FolderPlus } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { projectsApi } from "@/lib/api/projects-api"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
}

interface CreateProjectData {
  name: string
  description?: string
  checklist_id?: string
}

export function CreateProjectModal({ isOpen, onClose }: CreateProjectModalProps) {
  const [formData, setFormData] = useState<CreateProjectData>({
    name: "",
    description: "",
    checklist_id: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  const queryClient = useQueryClient()

  const createProjectMutation = useMutation({
    mutationFn: projectsApi.createProject,
    onSuccess: (newProject) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] })
      queryClient.invalidateQueries({ queryKey: ["projects", "stats"] })
      toast({
        title: "Project created successfully",
        description: `${newProject.name} has been created.`,
      })
      onClose()
      resetForm()
    },
    onError: (error: any) => {
      toast({
        title: "Failed to create project",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    },
  })

  const resetForm = () => {
    setFormData({ name: "", description: "", checklist_id: "" })
    setErrors({})
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Project name is required"
    } else if (formData.name.length < 3) {
      newErrors.name = "Project name must be at least 3 characters"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    createProjectMutation.mutate(formData)
  }

  const handleClose = () => {
    if (!createProjectMutation.isPending) {
      onClose()
      resetForm()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                  <FolderPlus className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Create New Project</h2>
              </div>
              <button
                onClick={handleClose}
                disabled={createProjectMutation.isPending}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Project Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Project Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.name ? "border-red-500" : "border-slate-200 dark:border-slate-600"
                  }`}
                  placeholder="Enter project name"
                  disabled={createProjectMutation.isPending}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.name}</p>}
              </div>

              {/* Description */}
              <div>
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  placeholder="Optional project description"
                  disabled={createProjectMutation.isPending}
                />
              </div>

              {/* Checklist Template */}
              <div>
                <label
                  htmlFor="checklist"
                  className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2"
                >
                  Checklist Template
                </label>
                <select
                  id="checklist"
                  value={formData.checklist_id}
                  onChange={(e) => setFormData({ ...formData, checklist_id: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={createProjectMutation.isPending}
                >
                  <option value="">Select a template (optional)</option>
                  <option value="customer-service">Customer Service Quality</option>
                  <option value="sales-call">Sales Call Analysis</option>
                  <option value="support-call">Support Call Review</option>
                  <option value="custom">Custom Template</option>
                </select>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={createProjectMutation.isPending}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createProjectMutation.isPending}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {createProjectMutation.isPending ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <FolderPlus className="w-4 h-4 mr-2" />
                      Create Project
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
