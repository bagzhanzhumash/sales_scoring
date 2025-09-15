import { NextResponse } from "next/server"
import type { AnalysisResult } from "@/types/projects"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const mockResults: AnalysisResult[] = [
    {
      id: "result-1",
      file_id: "file-1",
      file_name: "customer-call-001.mp3",
      overall_score: 85,
      accuracy: 92,
      status: "completed",
      criteria_scores: {
        greeting: 90,
        identification: 95,
        problem_understanding: 80,
        solution_provided: 85,
        closing: 88,
      },
      confidence_scores: {
        greeting: 95,
        identification: 98,
        problem_understanding: 85,
        solution_provided: 90,
        closing: 92,
      },
      created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    },
    {
      id: "result-2",
      file_id: "file-2",
      file_name: "customer-call-002.mp3",
      overall_score: 78,
      accuracy: 88,
      status: "completed",
      criteria_scores: {
        greeting: 85,
        identification: 90,
        problem_understanding: 75,
        solution_provided: 70,
        closing: 80,
      },
      confidence_scores: {
        greeting: 90,
        identification: 95,
        problem_understanding: 80,
        solution_provided: 75,
        closing: 85,
      },
      created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    },
  ]

  return NextResponse.json(mockResults)
}
