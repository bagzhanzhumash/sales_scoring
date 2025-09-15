import { NextResponse } from "next/server"
import type { ProjectStats } from "@/types/projects"

export async function GET() {
  const stats: ProjectStats = {
    total_projects: 128,
    active_projects: 45,
    completed_today: 8,
    total_files: 2847,
    average_accuracy: 86,
    processing_hours_saved: 1247,
  }

  return NextResponse.json(stats)
}
