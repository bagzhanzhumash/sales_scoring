import { type NextRequest, NextResponse } from "next/server"
import type { ExportRequest, ExportResponse } from "@/types/projects"

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7777"

// Mock export data
const mockExports: ExportResponse[] = [
  {
    id: "export-1",
    status: "completed",
    download_url: "/api/v1/exports/export-1/download",
    file_name: "project_analysis_detailed_20241219.xlsx",
    file_size: 1248576,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "export-2",
    status: "processing",
    file_name: "bulk_export_summary_20241219.csv",
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  },
  {
    id: "export-3",
    status: "failed",
    file_name: "analysis_report_20241219.pdf",
    created_at: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    error_message: "PDF generation failed: Template not found"
  }
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const status = searchParams.get('status')
  const page = Number.parseInt(searchParams.get("page") || "1")
  const limit = Number.parseInt(searchParams.get("limit") || "20")
  
  try {
    if (action === 'backend') {
      // Fetch from real backend
      const response = await fetch(`${API_BASE_URL}/api/v1/exports?${searchParams.toString()}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status}`)
      }
      
      const data = await response.json()
      return NextResponse.json(data)
    }
    
    if (action === 'templates') {
      // Get available export templates
      const templates = [
        {
          id: "standard",
          name: "Standard Report",
          description: "Basic analysis results with scores and categories",
          supports_formats: ["excel", "csv", "json"],
          estimated_size: "small",
          processing_time: "fast"
        },
        {
          id: "detailed",
          name: "Detailed Report",
          description: "Complete analysis with transcriptions, reasoning, and metadata",
          supports_formats: ["excel", "pdf", "json"],
          estimated_size: "large",
          processing_time: "medium"
        },
        {
          id: "summary",
          name: "Executive Summary",
          description: "High-level overview with key metrics and insights",
          supports_formats: ["excel", "pdf", "csv"],
          estimated_size: "small",
          processing_time: "fast"
        },
        {
          id: "custom",
          name: "Custom Template",
          description: "User-defined template with configurable fields",
          supports_formats: ["excel", "csv", "json"],
          estimated_size: "variable",
          processing_time: "variable"
        }
      ]
      
      return NextResponse.json({ templates })
    }
    
    // Filter exports
    let filteredExports = mockExports
    
    if (status && status !== "all") {
      filteredExports = filteredExports.filter(exp => exp.status === status)
    }
    
    // Sort by creation date (newest first)
    filteredExports.sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    
    // Paginate
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedExports = filteredExports.slice(startIndex, endIndex)
    
    return NextResponse.json({
      exports: paginatedExports,
      total: filteredExports.length,
      page,
      pages: Math.ceil(filteredExports.length / limit),
      has_next: endIndex < filteredExports.length,
      has_previous: page > 1,
    })
    
  } catch (error) {
    console.error('Error fetching exports:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exports' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const exportRequest: ExportRequest = await request.json()
    
    // Validate request
    if (!exportRequest.format || !exportRequest.template) {
      return NextResponse.json(
        { error: 'Format and template are required' },
        { status: 400 }
      )
    }
    
    // Try backend first
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/exports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportRequest),
      })
      
      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data, { status: 201 })
      }
    } catch (error) {
      console.warn('Backend export creation failed, using mock response:', error)
    }
    
    // Generate file name based on request
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
    const projectPart = exportRequest.project_id ? `project_${exportRequest.project_id}` : 'bulk_export'
    const fileName = `${projectPart}_${exportRequest.template}_${timestamp}.${exportRequest.format}`
    
    // Mock export response
    const newExport: ExportResponse = {
      id: `export-${Date.now()}`,
      status: "pending",
      file_name: fileName,
      created_at: new Date().toISOString()
    }
    
    // Simulate processing time based on template and format
    const processingTime = getEstimatedProcessingTime(exportRequest.template, exportRequest.format)
    
    // Simulate async processing
    setTimeout(() => {
      console.log(`Mock export ${newExport.id} would be completed in ${processingTime}ms`)
    }, processingTime)
    
    return NextResponse.json(newExport, { status: 201 })
    
  } catch (error) {
    console.error('Error creating export:', error)
    return NextResponse.json(
      { error: 'Failed to create export' },
      { status: 500 }
    )
  }
}

function getEstimatedProcessingTime(template: string, format: string): number {
  const baseTime = 5000 // 5 seconds
  
  const templateMultipliers = {
    'standard': 1,
    'detailed': 3,
    'summary': 0.5,
    'custom': 2
  }
  
  const formatMultipliers = {
    'excel': 1,
    'csv': 0.5,
    'json': 0.3,
    'pdf': 2
  }
  
  const templateMultiplier = templateMultipliers[template as keyof typeof templateMultipliers] || 1
  const formatMultiplier = formatMultipliers[format as keyof typeof formatMultipliers] || 1
  
  return baseTime * templateMultiplier * formatMultiplier
} 