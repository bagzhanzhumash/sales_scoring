"use client"

import { motion } from "framer-motion"
import { Server, Wifi, Database, Cpu, AlertTriangle, CheckCircle, XCircle } from "lucide-react"
import type { SystemStatus } from "@/types/dashboard"

interface SystemHealthMonitorProps {
  status?: SystemStatus
}

export function SystemHealthMonitor({ status }: SystemHealthMonitorProps) {
  const getStatusIcon = (serviceStatus: string) => {
    switch (serviceStatus) {
      case "online":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case "degraded":
        return <AlertTriangle className="w-4 h-4 text-amber-500" />
      case "offline":
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <CheckCircle className="w-4 h-4 text-slate-400" />
    }
  }

  const getServiceIcon = (serviceName: string) => {
    const iconClass = "w-4 h-4 text-slate-600"

    switch (serviceName.toLowerCase()) {
      case "api":
        return <Server className={iconClass} />
      case "database":
        return <Database className={iconClass} />
      case "websocket":
        return <Wifi className={iconClass} />
      case "worker":
        return <Cpu className={iconClass} />
      default:
        return <Server className={iconClass} />
    }
  }

  const getOverallStatusColor = () => {
    switch (status?.status) {
      case "healthy":
        return "text-emerald-500"
      case "warning":
        return "text-amber-500"
      case "error":
        return "text-red-500"
      default:
        return "text-slate-500"
    }
  }

  const getOverallStatusText = () => {
    switch (status?.status) {
      case "healthy":
        return "All Systems Operational"
      case "warning":
        return "Some Issues Detected"
      case "error":
        return "System Issues"
      default:
        return "Status Unknown"
    }
  }

  const defaultServices = [
    { name: "API", status: "online", response_time_ms: 45, last_check: new Date().toISOString() },
    { name: "Database", status: "online", response_time_ms: 12, last_check: new Date().toISOString() },
    { name: "WebSocket", status: "online", response_time_ms: 8, last_check: new Date().toISOString() },
    { name: "Worker", status: "online", response_time_ms: 23, last_check: new Date().toISOString() },
  ]

  const services = status?.services || defaultServices

  return (
    <motion.div
      className="bg-white/95 backdrop-blur-xl rounded-xl p-6 shadow-xl border border-white/20"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.4 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200">System Health</h3>
        <div className={`flex items-center space-x-2 ${getOverallStatusColor()}`}>
          <div className="w-2 h-2 rounded-full bg-current animate-pulse"></div>
          <span className="text-sm font-medium">Live</span>
        </div>
      </div>

      {/* Overall Status */}
      <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Overall Status</span>
          <span className={`text-sm font-semibold ${getOverallStatusColor()}`}>{getOverallStatusText()}</span>
        </div>
      </div>

      {/* Services List */}
      <div className="space-y-3">
        {services.map((service, index) => (
          <motion.div
            key={service.name}
            className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <div className="flex items-center space-x-3">
              {getServiceIcon(service.name)}
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{service.name}</span>
            </div>

            <div className="flex items-center space-x-2">
              {service.response_time_ms && (
                <span className="text-xs text-slate-500 dark:text-slate-400">{service.response_time_ms}ms</span>
              )}
              {getStatusIcon(service.status)}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Queue Status */}
      <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{status?.active_tasks || 0}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Active Tasks</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{status?.queue_length || 0}</p>
            <p className="text-xs text-slate-600 dark:text-slate-400">Queue Length</p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
