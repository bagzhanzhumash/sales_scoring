"use client"

import { AlertCircle, RefreshCw } from "lucide-react"

interface DashboardErrorProps {
  onRetry: () => void
}

export function DashboardError({ onRetry }: DashboardErrorProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="text-center py-12 px-6">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Unable to load dashboard</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">
          We're having trouble connecting to our servers. Please check your connection and try again.
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  )
}
