import { type NextRequest, NextResponse } from "next/server"
import type { ExportResponse } from "@/types/projects"

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7777"

// Mock export details
const mockExportDetails: Record<string, ExportResponse> = {
  "export-1": {
    id: "export-1",
    status: "completed",
    download_url: "/api/v1/exports/export-1/download",
    file_name: "project_analysis_detailed_20241219.xlsx",
    file_size: 1248576,
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    completed_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  },
  "export-2": {
    id: "export-2",
    status: "processing",
    file_name: "bulk_export_summary_20241219.csv",
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { exportId: string } }
) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  try {
    if (action === 'backend') {
      // Fetch from real backend
      const response = await fetch(`${API_BASE_URL}/api/v1/exports/${params.exportId}`, {
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
    
    if (action === 'download') {
      // Download export file
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/exports/${params.exportId}/download`)
        
        if (response.ok) {
          const exportDetails = mockExportDetails[params.exportId]
          const headers = new Headers()
          headers.set('Content-Disposition', `attachment; filename="${exportDetails?.file_name || 'export.xlsx'}"`)
          headers.set('Content-Type', getContentType(exportDetails?.file_name || ''))
          
          return new Response(response.body, {
            status: 200,
            headers,
          })
        }
      } catch (error) {
        console.warn('Backend download failed:', error)
      }
      
      // Mock download - generate sample Excel content
      const exportDetails = mockExportDetails[params.exportId]
      if (!exportDetails || exportDetails.status !== 'completed') {
        return NextResponse.json(
          { error: 'Export not ready for download' },
          { status: 400 }
        )
      }
      
      // For demo purposes, return download URL
      return NextResponse.json({
        download_url: `/api/v1/exports/${params.exportId}/file`,
        expires_at: exportDetails.expires_at,
        file_name: exportDetails.file_name,
        file_size: exportDetails.file_size
      })
    }
    
    if (action === 'status') {
      // Get export status and progress
      const exportDetails = mockExportDetails[params.exportId]
      if (!exportDetails) {
        return NextResponse.json(
          { error: 'Export not found' },
          { status: 404 }
        )
      }
      
      // Simulate progress for processing exports
      let progress = 100
      if (exportDetails.status === 'processing') {
        const elapsed = Date.now() - new Date(exportDetails.created_at).getTime()
        const estimatedTotal = 5 * 60 * 1000 // 5 minutes
        progress = Math.min(95, Math.floor((elapsed / estimatedTotal) * 100))
      }
      
      return NextResponse.json({
        id: exportDetails.id,
        status: exportDetails.status,
        progress,
        created_at: exportDetails.created_at,
        completed_at: exportDetails.completed_at,
        error_message: exportDetails.error_message,
        estimated_completion: exportDetails.status === 'processing' 
          ? new Date(Date.now() + (5 * 60 * 1000) * (1 - progress / 100)).toISOString()
          : undefined
      })
    }
    
    // Default: return export details
    const exportDetails = mockExportDetails[params.exportId]
    if (!exportDetails) {
      return NextResponse.json(
        { error: 'Export not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(exportDetails)
    
  } catch (error) {
    console.error('Error fetching export:', error)
    return NextResponse.json(
      { error: 'Failed to fetch export' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { exportId: string } }
) {
  try {
    // Try backend first
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/exports/${params.exportId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })
      
      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }
    } catch (error) {
      console.warn('Backend delete failed, using mock response:', error)
    }
    
    const exportDetails = mockExportDetails[params.exportId]
    if (!exportDetails) {
      return NextResponse.json(
        { error: 'Export not found' },
        { status: 404 }
      )
    }
    
    // Check if export can be cancelled
    if (exportDetails.status === 'completed') {
      return NextResponse.json(
        { error: 'Cannot delete completed export' },
        { status: 400 }
      )
    }
    
    // Mock cancellation response
    return NextResponse.json({
      message: `Export ${params.exportId} cancelled successfully`,
      cancelled_at: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error deleting export:', error)
    return NextResponse.json(
      { error: 'Failed to delete export' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { exportId: string } }
) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  try {
    if (action === 'retry') {
      // Retry failed export
      const exportDetails = mockExportDetails[params.exportId]
      if (!exportDetails) {
        return NextResponse.json(
          { error: 'Export not found' },
          { status: 404 }
        )
      }
      
      if (exportDetails.status !== 'failed') {
        return NextResponse.json(
          { error: 'Can only retry failed exports' },
          { status: 400 }
        )
      }
      
      // Try backend first
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/exports/${params.exportId}/retry`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          return NextResponse.json(data)
        }
      } catch (error) {
        console.warn('Backend retry failed, using mock response:', error)
      }
      
      // Mock retry response
      const retriedExport: ExportResponse = {
        ...exportDetails,
        status: "pending",
        error_message: undefined,
        created_at: new Date().toISOString()
      }
      
      return NextResponse.json(retriedExport)
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('Error in export POST:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

function getContentType(fileName: string): string {
  const extension = fileName.split('.').pop()?.toLowerCase()
  
  switch (extension) {
    case 'xlsx':
    case 'xls':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    case 'csv':
      return 'text/csv'
    case 'pdf':
      return 'application/pdf'
    case 'json':
      return 'application/json'
    default:
      return 'application/octet-stream'
  }
} 