import { NextResponse } from "next/server"
import type { DashboardStats } from "@/types/dashboard"

export async function GET() {
  // --- MOCK DATA (feel free to delete when backend is ready) ---
  const now = Date.now()
  const days = 30
  const trend = Array.from({ length: days }, (_, i) => {
    const date = new Date(now - (days - i) * 86400000)
    return {
      date: date.toISOString(),
      projects_completed: Math.floor(Math.random() * 10) + 5,
      files_processed: Math.floor(Math.random() * 120) + 50,
      average_accuracy: Math.floor(Math.random() * 10) + 80,
    }
  })

  const mock: DashboardStats = {
    total_projects: 128,
    total_audio_files: 6243,
    total_completed_files: 6101,
    average_accuracy: 83,
    total_processing_hours: 913,
    projects_today: 4,
    files_today: 182,
    last_login: new Date(now - 86400000).toISOString(),

    // KPI trend deltas
    projects_change: "+2.1%",
    projects_trend: "up",
    files_change: "+1.3%",
    files_trend: "up",
    accuracy_change: "-0.4%",
    accuracy_trend: "down",
    hours_change: "+6.9%",
    hours_trend: "up",

    throughput_trend: trend,
    recent_activity: [
      {
        id: "1",
        type: "project_created",
        message: "Created project “Outbound QA May Batch”",
        project_name: "Outbound QA May Batch",
        timestamp: new Date(now - 2 * 3600000).toISOString(),
        status: "success",
        user: "alice",
      },
      {
        id: "2",
        type: "file_uploaded",
        message: "Uploaded 95 audio files",
        project_name: "Outbound QA May Batch",
        timestamp: new Date(now - 5400000).toISOString(),
        status: "success",
        user: "bob",
      },
      {
        id: "3",
        type: "analysis_completed",
        message: "Analysis completed for 95 files",
        project_name: "Outbound QA May Batch",
        timestamp: new Date(now - 3600000).toISOString(),
        status: "success",
        user: "system",
      },
    ],
  }

  return NextResponse.json(mock)
}
