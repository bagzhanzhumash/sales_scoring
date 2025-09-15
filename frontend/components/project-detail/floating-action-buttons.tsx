"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Plus, Upload, Play, Download, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { AudioFile, AnalysisResult } from "@/types/projects"

interface FloatingActionButtonsProps {
  activeTab: string
  projectId: string
  files: AudioFile[]
  results: AnalysisResult[]
}

export function FloatingActionButtons({ activeTab, projectId, files, results }: FloatingActionButtonsProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getActions = () => {
    switch (activeTab) {
      case "files":
        return [
          { icon: Upload, label: "Upload Files", action: () => console.log("Upload") },
          { icon: Play, label: "Process All", action: () => console.log("Process") },
        ]
      case "results":
        return [
          { icon: Download, label: "Export All", action: () => console.log("Export") },
          { icon: Edit, label: "Edit Results", action: () => console.log("Edit") },
        ]
      default:
        return [
          { icon: Upload, label: "Upload Files", action: () => console.log("Upload") },
          { icon: Play, label: "Process Files", action: () => console.log("Process") },
        ]
    }
  }

  const actions = getActions()

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            className="flex flex-col space-y-3 mb-3"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            {actions.map((action, index) => (
              <motion.div
                key={action.label}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Button
                  onClick={action.action}
                  className="bg-white/95 backdrop-blur-xl text-slate-700 hover:text-slate-900 shadow-lg border border-white/20 hover:bg-white"
                  size="sm"
                >
                  <action.icon className="w-4 h-4 mr-2" />
                  {action.label}
                </Button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-14 h-14 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isExpanded ? 45 : 0 }}
      >
        <Plus className="w-6 h-6" />
      </motion.button>
    </div>
  )
}
