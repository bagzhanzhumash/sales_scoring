import { type NextRequest, NextResponse } from "next/server"
import type { Project } from "@/types/projects"

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7777"

// Mock project data
const mockProject: Project = {
  id: "1",
  name: "Customer Service Q2 Analysis",
  description: "Quarterly review of customer service calls for quality assurance and training purposes",
  status: "active",
  checklist_id: "cs-quality-v1",
  total_files: 45,
  processed_files: 32,
  average_score: 87,
  files_count: 45,
  completion_percentage: 71,
  created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  // Legacy fields for backward compatibility
  creator_name: "Alice Johnson",
  audio_files_count: 45,
  completed_files_count: 32,
  pending_files_count: 13,
  average_accuracy: 87,
  checklist_name: "Customer Service Quality",
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  if (action === 'checklist') {
    // Get project checklist
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/checklists/projects/${params.id}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        if (response.status === 404) {
          return NextResponse.json({ error: 'Checklist not found' }, { status: 404 })
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return NextResponse.json(data)
    } catch (error) {
      console.error('Error fetching project checklist:', error)
      return NextResponse.json({ error: 'Failed to fetch checklist' }, { status: 500 })
    }
  }
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500))

  return NextResponse.json({
    ...mockProject,
    id: params.id,
  })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  if (action === 'checklist') {
    // Update project checklist
    try {
      const body = await request.json()
      
      const response = await fetch(`${API_BASE_URL}/api/v1/checklists/projects/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      return NextResponse.json(data)
    } catch (error) {
      console.error('Error updating project checklist:', error)
      return NextResponse.json({ error: 'Failed to update checklist' }, { status: 500 })
    }
  }
  
  const updates = await request.json()

  const updatedProject = {
    ...mockProject,
    id: params.id,
    ...updates,
    updated_at: new Date().toISOString(),
  }

  return NextResponse.json(updatedProject)
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  return NextResponse.json({ success: true })
}
