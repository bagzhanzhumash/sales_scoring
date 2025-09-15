"use client"

import { useQuery } from "@tanstack/react-query"
import { motion } from "framer-motion"
import { statsApi } from "@/lib/api/stats-api"
import { WelcomeBanner } from "./welcome-banner"
import { KPICards } from "./kpi-cards"
import { ThroughputChart } from "./throughput-chart"
import { ActivityFeed } from "./activity-feed"
import { SystemHealthMonitor } from "./system-health-monitor"
import { QuickActionsPanel } from "./quick-actions-panel"
import { DashboardSkeleton } from "./dashboard-skeleton"
import { DashboardError } from "./dashboard-error"
import type { DashboardStats } from "@/types/dashboard"

interface DashboardClientProps {
  initialData: DashboardStats | null
}

export function DashboardClient({ initialData }: DashboardClientProps) {
  const {
    data: dashboardStats,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["stats", "dashboard"],
    queryFn: statsApi.getDashboardStats,
    initialData,
    refetchInterval: 30000, // 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  const { data: systemStatus } = useQuery({
    queryKey: ["stats", "system-status"],
    queryFn: statsApi.getSystemStatus,
    refetchInterval: 15000, // 15 seconds
    retry: 2,
  })

  if (error && !initialData) {
    return <DashboardError onRetry={() => refetch()} />
  }

  if (isLoading && !initialData) {
    return <DashboardSkeleton />
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  }

  return (
    <motion.div
      className="container mx-auto px-4 py-8 space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <nav className="text-sm text-slate-600 dark:text-slate-400 mb-4">Dashboard</nav>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
          Speech Analytics Dashboard
        </h1>
      </motion.div>

      {/* Welcome Banner */}
      <motion.div variants={itemVariants}>
        <WelcomeBanner
          userName="Admin"
          lastLogin={dashboardStats?.last_login}
          systemStatus={systemStatus?.status || "healthy"}
        />
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={itemVariants}>
        <KPICards stats={dashboardStats} />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Throughput Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-6">
          <ThroughputChart data={dashboardStats?.throughput_trend || []} timeRange="30d" />
        </motion.div>

        {/* Activity Feed */}
        <motion.div variants={itemVariants} className="lg:col-span-4">
          <ActivityFeed activities={dashboardStats?.recent_activity || []} />
        </motion.div>

        {/* System Health Monitor */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <SystemHealthMonitor status={systemStatus} />
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <QuickActionsPanel />
      </motion.div>
    </motion.div>
  )
}
