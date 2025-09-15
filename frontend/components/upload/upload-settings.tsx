"use client"

import { useState } from "react"
import { ChevronDown, Settings } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import type { UploadSettings as UploadSettingsType } from "@/types/upload"

interface UploadSettingsProps {
  settings: UploadSettingsType
  onSettingsChange: (settings: UploadSettingsType) => void
}

export function UploadSettings({ settings, onSettingsChange }: UploadSettingsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const checklists = [
    { id: "automotive-sales", name: "Automotive Sales" },
    { id: "customer-service", name: "Customer Service Quality" },
    { id: "support-call", name: "Support Call Review" },
    { id: "custom", name: "Custom Template" },
  ]

  const models = [
    { id: "gpt-4", name: "GPT-4", description: "Most accurate, slower processing" },
    { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", description: "Fast processing, good accuracy" },
    { id: "claude-3", name: "Claude 3", description: "Excellent for detailed analysis" },
  ]

  return (
    <div className="bg-white/95 backdrop-blur-xl rounded-xl shadow-xl border border-white/20 p-6">
      <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Upload Settings</h3>
        </div>
        <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 space-y-6"
          >
            {/* Quick Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Checklist */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Default Checklist
                </label>
                <select
                  value={settings.checklistId || ""}
                  onChange={(e) => onSettingsChange({ ...settings, checklistId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select checklist...</option>
                  {checklists.map((checklist) => (
                    <option key={checklist.id} value={checklist.id}>
                      {checklist.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Model */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">LLM Model</label>
                <select
                  value={settings.model}
                  onChange={(e) => onSettingsChange({ ...settings, model: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {models.map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Auto Process - removed/disabled */}
              {/*
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  🤖 Auto-process
                </label>
                <div className="flex items-center space-x-3 h-10">
                  <input
                    type="checkbox"
                    checked={settings.autoProcess}
                    onChange={(e) => onSettingsChange({ ...settings, autoProcess: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <div className="flex flex-col">
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                      Start processing immediately after upload
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-500">
                      Includes: transcription (speech→text) + AI analysis of full conversation
                  </span>
                  </div>
                </div>
              </div>
              */}
            </div>

            {/* Advanced Settings */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <h4 className="text-md font-medium text-slate-800 dark:text-slate-200 mb-4">Advanced Settings</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Confidence Threshold */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Confidence Threshold: {settings.confidenceThreshold}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={settings.confidenceThreshold}
                    onChange={(e) =>
                      onSettingsChange({ ...settings, confidenceThreshold: Number.parseInt(e.target.value) })
                    }
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>

                {/* Notifications */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Notifications
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={settings.notifyOnComplete}
                        onChange={(e) => onSettingsChange({ ...settings, notifyOnComplete: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <span className="text-sm text-slate-600 dark:text-slate-400">
                        Email when processing completes
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
