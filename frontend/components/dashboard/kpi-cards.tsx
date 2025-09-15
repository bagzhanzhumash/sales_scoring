"use client"

import { motion } from "framer-motion"
import { Folder, FileAudio, BarChart3, Clock, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { useRouter } from "next/navigation"
import type { DashboardStats } from "@/types/dashboard"

interface KPICardsProps {
  stats: DashboardStats | null
}

export function KPICards({ stats }: KPICardsProps) {
  const router = useRouter()

  const kpiData = [
    {
      title: "Total Projects",
      value: stats?.total_projects || 0,
      change: stats?.projects_change || "+0%",
      trend: stats?.projects_trend || ("neutral" as const),
      icon: <Folder className="w-8 h-8" />,
      color: "blue" as const,
      onClick: () => router.push("/projects"),
    },
    {
      title: "Audio Files",
      value: stats?.total_audio_files || 0,
      change: stats?.files_change || "+0%",
      trend: stats?.files_trend || ("neutral" as const),
      icon: <FileAudio className="w-8 h-8" />,
      color: "green" as const,
      onClick: () => router.push("/projects"),
    },
    {
      title: "Avg Accuracy",
      value: `${stats?.average_accuracy || 0}%`,
      change: stats?.accuracy_change || "+0%",
      trend: stats?.accuracy_trend || ("neutral" as const),
      icon: <BarChart3 className="w-8 h-8" />,
      color: "purple" as const,
      onClick: () => router.push("/results"),
    },
    {
      title: "Hours Saved",
      value: stats?.total_processing_hours || 0,
      change: stats?.hours_change || "+0%",
      trend: stats?.hours_trend || ("neutral" as const),
      icon: <Clock className="w-8 h-8" />,
      color: "orange" as const,
      onClick: () => router.push("/analytics"),
    },
  ]

  const getColorClasses = (color: string) => {
    const colors = {
      blue: "from-blue-500 to-blue-600 text-blue-600",
      green: "from-emerald-500 to-emerald-600 text-emerald-600",
      purple: "from-purple-500 to-purple-600 text-purple-600",
      orange: "from-orange-500 to-orange-600 text-orange-600",
    }
    return colors[color as keyof typeof colors] || colors.blue
  }

  const getTrendIcon = (trend: "up" | "down" | "neutral") => {
    switch (trend) {
      case "up":
        return <TrendingUp className="w-4 h-4 text-emerald-500" />
      case "down":
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Minus className="w-4 h-4 text-slate-500" />
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiData.map((kpi, index) => (
        <motion.div
          key={kpi.title}
          className="bg-white/95 backdrop-blur-xl rounded-xl p-6 shadow-xl border border-white/20 cursor-pointer group"
          whileHover={{ scale: 1.05, y: -5 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
          onClick={kpi.onClick}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center justify-between mb-4">
            <div
              className={`p-3 rounded-lg bg-gradient-to-r ${getColorClasses(kpi.color).split(" ")[0]} ${getColorClasses(kpi.color).split(" ")[1]} text-white`}
            >
              {kpi.icon}
            </div>
            <div className="flex items-center space-x-1">
              {getTrendIcon(kpi.trend)}
              <span
                className={`text-sm font-medium ${
                  kpi.trend === "up" ? "text-emerald-600" : kpi.trend === "down" ? "text-red-600" : "text-slate-600"
                }`}
              >
                {kpi.change}
              </span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{kpi.title}</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 transition-colors">
              {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
            </p>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
