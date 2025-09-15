"use client"

import { motion } from "framer-motion"
import { Folder, FileAudio, CheckCircle, Clock } from "lucide-react"
import { useProjectsStore } from "@/store/projects-store"
import type { ProjectStats } from "@/types/projects"

interface ProjectsStatsProps {
  stats: ProjectStats | null
}

export function ProjectsStats({ stats }: ProjectsStatsProps) {
  const { setFilters } = useProjectsStore()

  const statsData = [
    {
      title: "Total Projects",
      value: stats?.total_projects || 0,
      icon: <Folder className="w-6 h-6" />,
      color: "from-blue-500 to-blue-600",
      onClick: () => setFilters({ status: "all" }),
    },
    {
      title: "Active Projects",
      value: stats?.active_projects || 0,
      icon: <Clock className="w-6 h-6" />,
      color: "from-amber-500 to-amber-600",
      onClick: () => setFilters({ status: "active" }),
    },
    {
      title: "Completed Today",
      value: stats?.completed_today || 0,
      icon: <CheckCircle className="w-6 h-6" />,
      color: "from-emerald-500 to-emerald-600",
      onClick: () => setFilters({ status: "completed", dateRange: "7d" }),
    },
    {
      title: "Total Files",
      value: stats?.total_files || 0,
      icon: <FileAudio className="w-6 h-6" />,
      color: "from-purple-500 to-purple-600",
      onClick: () => {},
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => (
        <motion.button
          key={stat.title}
          onClick={stat.onClick}
          className="bg-white/95 backdrop-blur-xl rounded-xl p-6 shadow-xl border border-white/20 text-left group hover:scale-105 transition-all duration-200"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color} text-white`}>{stat.icon}</div>
          </div>
          <div>
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{stat.title}</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
              {typeof stat.value === "number" ? stat.value.toLocaleString() : stat.value}
            </p>
          </div>
        </motion.button>
      ))}
    </div>
  )
}
