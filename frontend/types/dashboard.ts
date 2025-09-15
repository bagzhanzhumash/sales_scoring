export interface DashboardStats {
  total_projects: number
  total_audio_files: number
  total_completed_files: number
  average_accuracy: number
  total_processing_hours: number
  projects_today: number
  files_today: number
  last_login?: string

  // Trend data
  projects_change: string
  projects_trend: "up" | "down" | "neutral"
  files_change: string
  files_trend: "up" | "down" | "neutral"
  accuracy_change: string
  accuracy_trend: "up" | "down" | "neutral"
  hours_change: string
  hours_trend: "up" | "down" | "neutral"

  throughput_trend: ThroughputDataPoint[]
  recent_activity: ActivityItem[]
}

export interface ThroughputDataPoint {
  date: string
  projects_completed: number
  files_processed: number
  average_accuracy: number
}

export interface ActivityItem {
  id: string
  type: "project_created" | "file_uploaded" | "analysis_completed" | "export_generated"
  message: string
  project_name?: string
  timestamp: string
  status: "success" | "warning" | "error"
  user?: string
}

export interface SystemStatus {
  status: "healthy" | "warning" | "error"
  services: Array<{
    name: string
    status: "online" | "offline" | "degraded"
    response_time_ms?: number
    last_check: string
  }>
  active_tasks: number
  queue_length: number
}
