"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { FolderPlus, Upload, CheckCircle, FileText, XCircle, Clock } from "lucide-react"
import type { ActivityItem } from "@/types/dashboard"

interface ActivityFeedProps {
  activities: ActivityItem[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const router = useRouter()

  const getActivityIcon = (type: string, status: string) => {
    const iconClass = "w-4 h-4"

    switch (type) {
      case "project_created":
        return <FolderPlus className={`${iconClass} text-blue-500`} />
      case "file_uploaded":
        return <Upload className={`${iconClass} text-indigo-500`} />
      case "analysis_completed":
        return status === "success" ? (
          <CheckCircle className={`${iconClass} text-emerald-500`} />
        ) : (
          <XCircle className={`${iconClass} text-red-500`} />
        )
      case "export_generated":
        return <FileText className={`${iconClass} text-purple-500`} />
      default:
        return <Clock className={`${iconClass} text-slate-500`} />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "border-emerald-200 bg-emerald-50"
      case "warning":
        return "border-amber-200 bg-amber-50"
      case "error":
        return "border-red-200 bg-red-50"
      default:
        return "border-slate-200 bg-slate-50"
    }
  }

  const formatRelativeTime = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60))

    if (diffInMinutes < 1) return "Just now"
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`

    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`

    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const handleActivityClick = (activity: ActivityItem) => {
    if (activity.project_name) {
      // Navigate to project detail or relevant page
      router.push(`/projects/${activity.project_name}`)
    }
  }

  return (
    <motion.div
      className="bg-white/95 backdrop-blur-xl rounded-xl p-6 shadow-xl border border-white/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Recent Activity</h3>
        <button
          onClick={() => router.push("/activity")}
          className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
        >
          View All
        </button>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">No recent activity</p>
          </div>
        ) : (
          activities.map((activity, index) => (
            <motion.div
              key={activity.id}
              className={`flex items-start space-x-3 p-3 rounded-lg border cursor-pointer hover:shadow-md transition-all ${getStatusColor(activity.status)}`}
              onClick={() => handleActivityClick(activity)}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex-shrink-0 mt-1">{getActivityIcon(activity.type, activity.status)}</div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-slate-100">{activity.message}</p>
                {activity.project_name && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">Project: {activity.project_name}</p>
                )}
                {activity.user && <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">by {activity.user}</p>}
              </div>

              <div className="flex-shrink-0 text-xs text-slate-500 dark:text-slate-500">
                {formatRelativeTime(activity.timestamp)}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  )
}
