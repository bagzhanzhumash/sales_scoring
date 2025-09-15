"use client"

import { useState } from "react"
import { Trash2, Archive, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import type { Project } from "@/types/projects"

interface SettingsTabProps {
  projectId: string
  project: Project
}

export function SettingsTab({ projectId, project }: SettingsTabProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)

  return (
    <>
      <div className="space-y-8">
        {/* Project Information */}
        <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 p-6">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Project Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Project Name</label>
              <input
                type="text"
                defaultValue={project.name}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Description</label>
              <textarea
                rows={3}
                defaultValue={project.description}
                className="w-full px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>
        </div>

        {/* Processing Settings */}
        <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 p-6">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Processing Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Auto-process files</label>
                <p className="text-sm text-slate-500 dark:text-slate-400">Automatically process files when uploaded</p>
              </div>
              <input type="checkbox" defaultChecked className="w-4 h-4 text-blue-600 rounded" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Confidence Threshold
              </label>
              <input
                type="range"
                min="0"
                max="100"
                defaultValue="80"
                className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400 mt-1">
                <span>0%</span>
                <span>80%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <h3 className="text-xl font-semibold text-red-900 dark:text-red-100">Danger Zone</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-red-900 dark:text-red-100">Archive Project</h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Archive this project to hide it from the main list
                </p>
              </div>
              <Button variant="outline" onClick={() => setShowArchiveConfirm(true)}>
                <Archive className="w-4 h-4 mr-2" />
                Archive
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-red-900 dark:text-red-100">Delete Project</h4>
                <p className="text-sm text-red-700 dark:text-red-300">
                  Permanently delete this project and all its data
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(true)}
                className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          // Handle delete
          setShowDeleteConfirm(false)
        }}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone and will permanently remove all files, results, and settings."
        confirmText="Delete Project"
        confirmVariant="destructive"
      />

      <ConfirmDialog
        isOpen={showArchiveConfirm}
        onClose={() => setShowArchiveConfirm(false)}
        onConfirm={() => {
          // Handle archive
          setShowArchiveConfirm(false)
        }}
        title="Archive Project"
        description="Are you sure you want to archive this project? You can restore it later from the archived projects section."
        confirmText="Archive Project"
      />
    </>
  )
}
