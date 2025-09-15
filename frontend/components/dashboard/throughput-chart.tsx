"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { Calendar } from "lucide-react"

interface ThroughputDataPoint {
  date: string
  projects_completed: number
  files_processed: number
  average_accuracy: number
}

interface ThroughputChartProps {
  data: ThroughputDataPoint[]
  timeRange?: "7d" | "30d" | "90d"
}

export function ThroughputChart({ data, timeRange = "30d" }: ThroughputChartProps) {
  const [selectedRange, setSelectedRange] = useState(timeRange)
  const [activeMetric, setActiveMetric] = useState<"projects" | "files" | "accuracy">("projects")

  const timeRangeOptions = [
    { value: "7d", label: "7 Days" },
    { value: "30d", label: "30 Days" },
    { value: "90d", label: "90 Days" },
  ]

  const metricOptions = [
    { value: "projects", label: "Projects", color: "#3b82f6" },
    { value: "files", label: "Files", color: "#10b981" },
    { value: "accuracy", label: "Accuracy", color: "#8b5cf6" },
  ]

  const formatTooltipValue = (value: number, name: string) => {
    if (name.includes("accuracy")) {
      return [`${value}%`, "Accuracy"]
    }
    return [value.toLocaleString(), name]
  }

  const formatXAxisLabel = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  const getMetricData = () => {
    switch (activeMetric) {
      case "files":
        return "files_processed"
      case "accuracy":
        return "average_accuracy"
      default:
        return "projects_completed"
    }
  }

  const getCurrentMetricColor = () => {
    return metricOptions.find((m) => m.value === activeMetric)?.color || "#3b82f6"
  }

  return (
    <motion.div
      className="bg-white/95 backdrop-blur-xl rounded-xl p-6 shadow-xl border border-white/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center space-x-2 mb-4 sm:mb-0">
          <Calendar className="w-5 h-5 text-slate-600" />
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">Throughput Trends</h3>
        </div>

        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
          {/* Metric Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {metricOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setActiveMetric(option.value as any)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                  activeMetric === option.value
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Time Range Selector */}
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {timeRangeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedRange(option.value as any)}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-all ${
                  selectedRange === option.value
                    ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={getCurrentMetricColor()} stopOpacity={0.3} />
                <stop offset="95%" stopColor={getCurrentMetricColor()} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="date" tickFormatter={formatXAxisLabel} stroke="#64748b" fontSize={12} />
            <YAxis stroke="#64748b" fontSize={12} />
            <Tooltip
              formatter={formatTooltipValue}
              labelFormatter={(label) => `Date: ${formatXAxisLabel(label)}`}
              contentStyle={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
              }}
            />
            <Area
              type="monotone"
              dataKey={getMetricData()}
              stroke={getCurrentMetricColor()}
              strokeWidth={3}
              fill="url(#colorGradient)"
              dot={{ fill: getCurrentMetricColor(), strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: getCurrentMetricColor(), strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
