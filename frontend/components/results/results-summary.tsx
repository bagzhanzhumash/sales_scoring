"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown } from "lucide-react"
import type { AnalysisResult } from "@/types/projects"

interface ResultsSummaryProps {
  results: AnalysisResult[]
}

export function ResultsSummary({ results }: ResultsSummaryProps) {
  const totalFiles = results.length
  const completedFiles = results.filter((r) => r.status === "completed").length
  const averageScore =
    results.length > 0 ? Math.round(results.reduce((sum, r) => sum + r.overall_score, 0) / results.length) : 0
  const averageAccuracy =
    results.length > 0 ? Math.round(results.reduce((sum, r) => sum + (r.accuracy || 0), 0) / results.length) : 0
  const completionRate = totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0
  const pendingReview = results.filter((r) => r.status === "review_needed").length

  const summaryCards = [
    {
      title: "Average Score",
      value: `${averageScore}%`,
      change: "+5%", // Mock trend
      trend: "up" as const,
      icon: "📊",
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Completion",
      value: `${completedFiles}/${totalFiles}`,
      subtitle: `${completionRate}% complete`,
      icon: "✅",
      color: "from-emerald-500 to-emerald-600",
    },
    {
      title: "Avg Confidence",
      value: `${averageAccuracy}%`,
      change: "+2%", // Mock trend
      trend: "up" as const,
      icon: "🎯",
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Needs Review",
      value: pendingReview.toString(),
      subtitle: pendingReview > 0 ? "Action required" : "All clear",
      icon: pendingReview > 0 ? "⚠️" : "✅",
      color: pendingReview > 0 ? "from-amber-500 to-amber-600" : "from-emerald-500 to-emerald-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {summaryCards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className="bg-white/95 backdrop-blur-xl rounded-xl p-6 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-200"
          whileHover={{ y: -2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg bg-gradient-to-r ${card.color} text-white text-xl`}>{card.icon}</div>
            {card.trend && (
              <div
                className={`flex items-center space-x-1 ${card.trend === "up" ? "text-emerald-600" : "text-red-600"}`}
              >
                {card.trend === "up" ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span className="text-sm font-medium">{card.change}</span>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{card.title}</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{card.value}</p>
            {card.subtitle && <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{card.subtitle}</p>}
          </div>
        </motion.div>
      ))}
    </div>
  )
}
