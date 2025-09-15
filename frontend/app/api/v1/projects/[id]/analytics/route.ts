import { NextResponse } from "next/server"
import type { ProjectAnalytics } from "@/types/projects"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const mockAnalytics: ProjectAnalytics = {
    accuracy_trend: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
      accuracy: Math.floor(Math.random() * 20) + 80,
      file_count: Math.floor(Math.random() * 5) + 1,
    })),
    processing_time_trend: Array.from({ length: 30 }, (_, i) => ({
      date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString(),
      avg_processing_time: Math.floor(Math.random() * 60) + 30,
      file_count: Math.floor(Math.random() * 5) + 1,
    })),
    criteria_performance: {
      greeting: {
        average_score: 88,
        pass_rate: 92,
        trend: "up",
      },
      identification: {
        average_score: 94,
        pass_rate: 98,
        trend: "stable",
      },
      problem_understanding: {
        average_score: 82,
        pass_rate: 85,
        trend: "down",
      },
      solution_provided: {
        average_score: 79,
        pass_rate: 82,
        trend: "up",
      },
      closing: {
        average_score: 86,
        pass_rate: 90,
        trend: "stable",
      },
    },
  }

  return NextResponse.json(mockAnalytics)
}
