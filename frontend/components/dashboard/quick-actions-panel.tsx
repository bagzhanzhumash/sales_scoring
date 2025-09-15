"use client"

import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Plus, Upload, FileText, Settings, ArrowRight } from "lucide-react"

export function QuickActionsPanel() {
  const router = useRouter()

  const quickActions = [
    {
      title: "New Project",
      description: "Create a new speech analysis project",
      icon: <Plus className="w-6 h-6" />,
      color: "from-blue-500 to-blue-600",
      href: "/projects/new",
      badge: null,
    },
    {
      title: "Upload Files",
      description: "Upload audio files for analysis",
      icon: <Upload className="w-6 h-6" />,
      color: "from-emerald-500 to-emerald-600",
      href: "/upload",
      badge: null,
    },
    {
      title: "View Results",
      description: "Browse analysis results and reports",
      icon: <FileText className="w-6 h-6" />,
      color: "from-purple-500 to-purple-600",
      href: "/results",
      badge: "New",
    },
    {
      title: "System Settings",
      description: "Configure system preferences",
      icon: <Settings className="w-6 h-6" />,
      color: "from-slate-500 to-slate-600",
      href: "/settings",
      badge: null,
    },
  ]

  return (
    <motion.div
      className="bg-white/95 backdrop-blur-xl rounded-xl p-6 shadow-xl border border-white/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.5 }}
    >
      <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-6">Quick Actions</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => (
          <motion.button
            key={action.title}
            onClick={() => router.push(action.href)}
            className="relative group p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-700 rounded-xl border border-slate-200 dark:border-slate-600 hover:shadow-lg transition-all duration-300 text-left"
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            {/* Badge */}
            {action.badge && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                {action.badge}
              </div>
            )}

            {/* Icon */}
            <div
              className={`inline-flex p-3 rounded-lg bg-gradient-to-r ${action.color} text-white mb-4 group-hover:scale-110 transition-transform`}
            >
              {action.icon}
            </div>

            {/* Content */}
            <div>
              <h4 className="font-semibold text-slate-900 dark:text-slate-100 mb-2 group-hover:text-blue-600 transition-colors">
                {action.title}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{action.description}</p>
            </div>

            {/* Arrow */}
            <div className="flex items-center justify-end">
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  )
}
