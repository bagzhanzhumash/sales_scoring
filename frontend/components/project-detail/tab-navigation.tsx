"use client"

import { motion } from "framer-motion"
import { BarChart3, FileAudio, FileText, CheckSquare, Settings, Star } from "lucide-react"
import type { AudioFile, AnalysisResult, ProjectUpdate } from "@/types/projects"

interface TabNavigationProps {
  activeTab: string
  onTabChange: (tab: string) => void
  files: AudioFile[]
  results: AnalysisResult[]
  wsUpdates: ProjectUpdate[]
}

export function TabNavigation({ activeTab, onTabChange, files, results, wsUpdates }: TabNavigationProps) {
  // Check if we have the required files for scoring
  const audioFiles = files.filter(f => {
    if (!f.name) return false
    const hasAudioExt = f.name.match(/\.(mp3|wav|m4a|ogg|mp4|avi|mov|wmv|flv)$/i)
    const hasAudioType = f.mime_type?.includes('audio') || f.mime_type?.includes('video') || f.format?.includes('audio')
    return hasAudioExt || hasAudioType
  })
  
  const transcriptFiles = files.filter(f => {
    if (!f.name) return false
    const hasTextExt = f.name.match(/\.(txt|json|srt|vtt|csv)$/i)
    const hasTextType = f.mime_type?.includes('text') || f.mime_type?.includes('json') || f.format?.includes('text')
    return hasTextExt || hasTextType
  })
  
  const canScore = audioFiles.length > 0 && transcriptFiles.length > 0

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: <BarChart3 className="w-4 h-4" />,
      badge: wsUpdates.length > 0 ? wsUpdates.length : undefined,
    },
    {
      id: "files",
      label: "Files",
      icon: <FileAudio className="w-4 h-4" />,
      badge: files.filter((f) => f.status === "pending").length || undefined,
    },
    {
      id: "results",
      label: "Results",
      icon: <FileText className="w-4 h-4" />,
      badge: results.filter((r) => r.status === "completed").length || undefined,
    },
    {
      id: "scoring",
      label: "Scoring",
      icon: <Star className="w-4 h-4" />,
      badge: canScore ? "Ready" : "Demo",
      disabled: false, // Always allow access to scoring interface
    },
    {
      id: "checklist",
      label: "Checklist",
      icon: <CheckSquare className="w-4 h-4" />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-4 h-4" />,
    },
  ]

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 p-2">
      <div className="flex space-x-1 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => !tab.disabled && onTabChange(tab.id)}
            disabled={tab.disabled}
            className={`relative flex items-center space-x-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${
              tab.disabled
                ? "text-slate-400 dark:text-slate-600 cursor-not-allowed"
                : activeTab === tab.id
                ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {tab.badge && (
              <motion.span
                className={`ml-2 px-2 py-1 text-xs font-bold rounded-full ${
                  tab.disabled
                    ? "bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400"
                    : typeof tab.badge === "string"
                    ? activeTab === tab.id
                      ? "bg-white/20 text-white"
                      : tab.badge === "Ready"
                      ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                      : tab.badge === "Demo"
                      ? "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                      : "bg-orange-100 text-orange-600 dark:bg-orange-900/20 dark:text-orange-400"
                    : activeTab === tab.id
                    ? "bg-white/20 text-white"
                    : "bg-blue-100 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {typeof tab.badge === "number" && tab.badge > 99 ? "99+" : tab.badge}
              </motion.span>
            )}
            {activeTab === tab.id && !tab.disabled && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg -z-10"
                layoutId="activeTab"
                transition={{ duration: 0.2 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
