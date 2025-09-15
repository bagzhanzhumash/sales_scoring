import { type NextRequest, NextResponse } from "next/server"
import type { Project, ProjectListResponse } from "@/types/projects"

// Mock data
const mockProjects: Project[] = [
  {
    id: "1",
    name: "Customer Service Q2 Analysis",
    description: "Quarterly review of customer service calls for quality assurance",
    status: "active",
    checklist_id: "cs-quality-v1",
    total_files: 45,
    processed_files: 32,
    average_score: 87,
    files_count: 45,
    completion_percentage: 71,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    // Legacy fields for backward compatibility
    creator_name: "Alice Johnson",
    audio_files_count: 45,
    completed_files_count: 32,
    pending_files_count: 13,
    average_accuracy: 87,
    checklist_name: "Customer Service Quality",
  },
  {
    id: "2",
    name: "Sales Team Training Review",
    description: "Analysis of sales call recordings for training purposes",
    status: "completed",
    checklist_id: "sales-analysis-v1",
    total_files: 28,
    processed_files: 28,
    average_score: 92,
    files_count: 28,
    completion_percentage: 100,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    // Legacy fields for backward compatibility
    creator_name: "Bob Smith",
    audio_files_count: 28,
    completed_files_count: 28,
    pending_files_count: 0,
    average_accuracy: 92,
    checklist_name: "Sales Call Analysis",
  },
  {
    id: "3",
    name: "Support Call Quality Check",
    description: "Weekly quality assessment of technical support calls",
    status: "pending",
    checklist_id: "support-review-v1",
    total_files: 15,
    processed_files: 0,
    average_score: 0,
    files_count: 15,
    completion_percentage: 0,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    // Legacy fields for backward compatibility
    creator_name: "Carol Davis",
    audio_files_count: 15,
    completed_files_count: 0,
    pending_files_count: 15,
    average_accuracy: 0,
    checklist_name: "Support Call Review",
  },
  {
    id: "4",
    name: "Onboarding Call Analysis",
    description: "Review of new customer onboarding calls",
    status: "active",
    checklist_id: "onboarding-v1",
    total_files: 22,
    processed_files: 18,
    average_score: 85,
    files_count: 22,
    completion_percentage: 82,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    // Legacy fields for backward compatibility
    creator_name: "David Wilson",
    audio_files_count: 22,
    completed_files_count: 18,
    pending_files_count: 4,
    average_accuracy: 85,
    checklist_name: "Customer Service Quality",
  },
  {
    id: "5",
    name: "Complaint Resolution Review",
    description: "Analysis of customer complaint handling calls",
    status: "failed",
    checklist_id: "complaint-review-v1",
    total_files: 8,
    processed_files: 3,
    average_score: 78,
    files_count: 8,
    completion_percentage: 38,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    // Legacy fields for backward compatibility
    creator_name: "Eva Brown",
    audio_files_count: 8,
    completed_files_count: 3,
    pending_files_count: 5,
    average_accuracy: 78,
    checklist_name: "Support Call Review",
  },
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const page = Number.parseInt(searchParams.get("page") || "1")
  const limit = Number.parseInt(searchParams.get("limit") || "20")
  const status = searchParams.get("status") || "all"
  const search = searchParams.get("search") || ""
  const sortBy = searchParams.get("sortBy") || "recent"

  // Filter projects
  let filteredProjects = mockProjects

  if (status !== "all") {
    filteredProjects = filteredProjects.filter((project) => project.status === status)
  }

  if (search) {
    filteredProjects = filteredProjects.filter(
      (project) =>
        project.name.toLowerCase().includes(search.toLowerCase()) ||
        project.description?.toLowerCase().includes(search.toLowerCase()),
    )
  }

  // Sort projects
  filteredProjects.sort((a, b) => {
    switch (sortBy) {
      case "name":
        return a.name.localeCompare(b.name)
      case "progress":
        const aProgress = (a.audio_files_count || 0) > 0 ? (a.completed_files_count || 0) / (a.audio_files_count || 1) : 0
        const bProgress = (b.audio_files_count || 0) > 0 ? (b.completed_files_count || 0) / (b.audio_files_count || 1) : 0
        return bProgress - aProgress
      case "accuracy":
        return (b.average_accuracy || 0) - (a.average_accuracy || 0)
      default: // recent
        return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    }
  })

  // Paginate
  const startIndex = (page - 1) * limit
  const endIndex = startIndex + limit
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex)

  const response: ProjectListResponse = {
    projects: paginatedProjects,
    total: filteredProjects.length,
    page,
    pages: Math.ceil(filteredProjects.length / limit),
    has_next: endIndex < filteredProjects.length,
    has_previous: page > 1,
  }

  return NextResponse.json(response)
}

export async function POST(request: NextRequest) {
  const data = await request.json()

  const newProject: Project = {
    id: Date.now().toString(),
    name: data.name,
    description: data.description,
    status: "pending",
    checklist_id: data.checklist_id,
    total_files: 0,
    processed_files: 0,
    average_score: null,
    files_count: 0,
    completion_percentage: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    // Legacy fields for backward compatibility
    creator_name: "Current User",
    audio_files_count: 0,
    completed_files_count: 0,
    pending_files_count: 0,
    average_accuracy: 0,
    checklist_name: data.checklist_id ? "Selected Template" : undefined,
  }

  return NextResponse.json(newProject, { status: 201 })
}
