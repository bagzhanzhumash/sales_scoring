"use client"

import { motion } from "framer-motion"
import { ProcessingStatusChart } from "../charts/processing-status-chart"
import { RecentActivityTimeline } from "../activity/recent-activity-timeline"
import { AccuracyTrendChart } from "../charts/accuracy-trend-chart"
import { QuickActionCards } from "../actions/quick-action-cards"
import { ProjectMetaInfo } from "../info/project-meta-info"
import type { Project, AudioFile, AnalysisResult, ProjectAnalytics, ProjectUpdate } from "@/types/projects"

interface OverviewTabProps {
  project: Project
  files: AudioFile[]
  results: AnalysisResult[]
  analytics: ProjectAnalytics
  wsUpdates: ProjectUpdate[]
}

export function OverviewTab({ project, files, results, analytics, wsUpdates }: OverviewTabProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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
    <motion.div className="space-y-8" variants={containerVariants} initial="hidden" animate="visible">
      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <QuickActionCards projectId={project.id} files={files} results={results} />
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Processing Status Chart */}
        <motion.div variants={itemVariants} className="lg:col-span-4">
          <ProcessingStatusChart files={files} />
        </motion.div>

        {/* Recent Activity Timeline */}
        <motion.div variants={itemVariants} className="lg:col-span-5">
          <RecentActivityTimeline wsUpdates={wsUpdates} files={files} results={results} />
        </motion.div>

        {/* Project Meta Info */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <ProjectMetaInfo project={project} />
        </motion.div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Accuracy Trend */}
        <motion.div variants={itemVariants}>
          <AccuracyTrendChart analytics={analytics} />
        </motion.div>

        {/* Processing Queue Status */}
        <motion.div variants={itemVariants}>
          <div className="bg-white/95 backdrop-blur-xl rounded-xl p-6 shadow-xl border border-white/20">
            <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-4">Processing Queue</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Files in Queue</span>
                <span className="text-2xl font-bold text-slate-900 dark:text-white">
                  {files.filter((f) => f.status === "pending").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Currently Processing</span>
                <span className="text-2xl font-bold text-blue-600">
                  {files.filter((f) => f.status === "processing").length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600 dark:text-slate-400">Estimated Time</span>
                <span className="text-lg font-semibold text-slate-700 dark:text-slate-300">
                  {files.filter((f) => f.status === "pending").length * 2} min
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
