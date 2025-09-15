import { type NextRequest, NextResponse } from "next/server"
import type { AudioFile, AudioProcessingRequest, AudioProcessingResponse, BulkOperationRequest, BulkOperationResponse } from "@/types/projects"

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7777"

// Mock audio files data
const mockAudioFiles: AudioFile[] = [
  {
    id: "audio-1",
    name: "customer_call_001.mp3",
    size: 2457600, // 2.4MB
    duration: 180, // 3 minutes
    status: "completed",
    upload_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    processing_started_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    processing_completed_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    progress: 100,
    file_path: "/uploads/customer_call_001.mp3",
    mime_type: "audio/mpeg",
    sample_rate: 44100,
    channels: 1,
    bitrate: 128,
    format: "mp3",
    transcription_id: "trans-1",
    analysis_id: "analysis-1",
    manager_name: "Василий",
    client_name: "Марина",
    call_type: "sales",
    quality_score: 87,
    is_deleted: false
  },
  {
    id: "audio-2",
    name: "support_call_002.wav",
    size: 4823040, // 4.6MB
    duration: 240, // 4 minutes
    status: "processing",
    upload_date: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    processing_started_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    progress: 65,
    file_path: "/uploads/support_call_002.wav",
    mime_type: "audio/wav",
    sample_rate: 44100,
    channels: 1,
    bitrate: 1411,
    format: "wav",
    call_type: "support",
    is_deleted: false
  },
  {
    id: "audio-3",
    name: "sales_call_003.mp3",
    size: 1843200, // 1.8MB
    duration: 150, // 2.5 minutes
    status: "failed",
    upload_date: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    processing_started_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    error_message: "Audio quality too low for transcription",
    progress: 0,
    file_path: "/uploads/sales_call_003.mp3",
    mime_type: "audio/mpeg",
    sample_rate: 22050,
    channels: 1,
    bitrate: 64,
    format: "mp3",
    call_type: "sales",
    is_deleted: false
  },
  {
    id: "audio-4",
    name: "training_call_004.mp3",
    size: 3276800, // 3.1MB
    duration: 200, // 3.3 minutes
    status: "pending",
    upload_date: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    progress: 0,
    file_path: "/uploads/training_call_004.mp3",
    mime_type: "audio/mpeg",
    sample_rate: 44100,
    channels: 1,
    bitrate: 128,
    format: "mp3",
    call_type: "training",
    is_deleted: false
  }
]

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  try {
    if (action === 'backend') {
      // Fetch from real backend
      const response = await fetch(`${API_BASE_URL}/api/v1/audio-files/projects/${params.id}`, {
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
    
    // Mock data with filtering and pagination
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "20")
    const status = searchParams.get("status")
    const search = searchParams.get("search") || ""
    const sortBy = searchParams.get("sortBy") || "recent"
    
    let filteredFiles = mockAudioFiles
    
    // Filter by status
    if (status && status !== "all") {
      filteredFiles = filteredFiles.filter(file => file.status === status)
    }
    
    // Filter by search
    if (search) {
      filteredFiles = filteredFiles.filter(file =>
        file.name.toLowerCase().includes(search.toLowerCase()) ||
        file.manager_name?.toLowerCase().includes(search.toLowerCase()) ||
        file.client_name?.toLowerCase().includes(search.toLowerCase())
      )
    }
    
    // Sort files
    filteredFiles.sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "size":
          return b.size - a.size
        case "duration":
          return (b.duration || 0) - (a.duration || 0)
        case "status":
          return a.status.localeCompare(b.status)
        default: // recent
          return new Date(b.upload_date).getTime() - new Date(a.upload_date).getTime()
      }
    })
    
    // Paginate
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedFiles = filteredFiles.slice(startIndex, endIndex)
    
    return NextResponse.json({
      files: paginatedFiles,
      total: filteredFiles.length,
      page,
      pages: Math.ceil(filteredFiles.length / limit),
      has_next: endIndex < filteredFiles.length,
      has_previous: page > 1,
    })
    
  } catch (error) {
    console.error('Error fetching audio files:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audio files' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const contentType = request.headers.get('content-type') || ''
  
  try {
    // Handle file uploads (FormData)
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const files = formData.getAll('files') as File[]
      const autoProcess = formData.get('auto_process') === 'true'
      
      // Validate files
      const errors: string[] = []
      const uploadedFiles: AudioFile[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        if (!file || !(file instanceof File)) {
          errors.push(`File ${i + 1}: Invalid file`)
          continue
        }

        // Check file size (500MB limit)
        if (file.size > 500 * 1024 * 1024) {
          errors.push(`${file.name}: File too large (max 500MB)`)
          continue
        }

        // Check file type
        const allowedTypes = ['audio/mpeg', 'audio/wav', 'audio/mp4', 'audio/x-m4a', 'audio/ogg']
        const allowedExtensions = ['.mp3', '.wav', '.m4a', '.ogg']
        
        const hasValidType = allowedTypes.includes(file.type)
        const hasValidExtension = allowedExtensions.some(ext => 
          file.name.toLowerCase().endsWith(ext)
        )

        if (!hasValidType && !hasValidExtension) {
          errors.push(`${file.name}: Unsupported format. Please use MP3, WAV, M4A, or OGG`)
          continue
        }

        // Generate mock file data
        const mockFile: AudioFile = {
          id: `audio-${Date.now()}-${i}`,
          name: file.name,
          size: file.size,
          duration: Math.floor(Math.random() * 600) + 60, // 1-10 minutes
          status: autoProcess ? "processing" : "completed",
          upload_date: new Date().toISOString(),
          processing_started_at: autoProcess ? new Date().toISOString() : undefined,
          processing_completed_at: autoProcess ? undefined : new Date().toISOString(),
          file_path: `/uploads/${params.id}/${file.name}`,
          mime_type: file.type || 'audio/mpeg',
          format: file.type.split('/')[1] || 'mp3',
          progress: autoProcess ? 5 : 100, // Just started or completed
          transcription_id: `trans-${Date.now()}-${i}`,
          analysis_id: `analysis-${Date.now()}-${i}`,
          manager_name: undefined,
          client_name: undefined,
          is_deleted: false
        }
        uploadedFiles.push(mockFile)
      }

      // Return upload response
      const response = {
        upload_session_id: params.id,
        uploaded_files: uploadedFiles,
        processing_started: autoProcess && uploadedFiles.length > 0,
        errors,
        total_files: files.length,
        successful_uploads: uploadedFiles.length,
        failed_uploads: errors.length
      }

      return NextResponse.json(response, { status: 201 })
    }

    // Handle JSON requests (existing functionality)
    const body = await request.json()
    
    if (action === 'process') {
      // Process audio files
      const processRequest: AudioProcessingRequest = body
      
      // Try backend first
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/projects/${params.id}/process`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(processRequest),
        })
        
        if (response.ok) {
          const data = await response.json()
          return NextResponse.json(data)
        }
      } catch (error) {
        console.warn('Backend processing failed, using mock response:', error)
      }
      
      // Mock processing response
      const mockResponse: AudioProcessingResponse = {
        task_id: `task-${Date.now()}`,
        status: "queued",
        message: "Files queued for processing",
        processed_files: 0,
        total_files: processRequest.file_ids.length,
        estimated_completion: new Date(Date.now() + 10 * 60 * 1000).toISOString()
      }
      
      return NextResponse.json(mockResponse)
    }
    
    if (action === 'bulk') {
      // Bulk operations
      const bulkRequest: BulkOperationRequest = body
      
      // Try backend first
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/projects/${params.id}/files/bulk`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(bulkRequest),
        })
        
        if (response.ok) {
          const data = await response.json()
          return NextResponse.json(data)
        }
      } catch (error) {
        console.warn('Backend bulk operation failed, using mock response:', error)
      }
      
      // Mock bulk operation response
      const mockResponse: BulkOperationResponse = {
        operation_id: `op-${Date.now()}`,
        status: "pending",
        total_items: bulkRequest.file_ids.length,
        processed_items: 0,
        failed_items: 0
      }
      
      return NextResponse.json(mockResponse)
    }
    
    // Upload new file
    const newFile: AudioFile = {
      id: `audio-${Date.now()}`,
      name: body.name || "uploaded_file.mp3",
      size: body.size || 0,
      duration: body.duration,
      status: "pending",
      upload_date: new Date().toISOString(),
      progress: 0,
      file_path: `/uploads/${body.name}`,
      mime_type: body.mime_type || "audio/mpeg",
      format: body.format || "mp3",
      is_deleted: false
    }
    
    return NextResponse.json(newFile, { status: 201 })
    
  } catch (error) {
    console.error('Error in audio files POST:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const fileIds = searchParams.get('file_ids')?.split(',') || []
  
  try {
    // Try backend first
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/projects/${params.id}/files`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ file_ids: fileIds }),
      })
      
      if (response.ok) {
        const data = await response.json()
        return NextResponse.json(data)
      }
    } catch (error) {
      console.warn('Backend delete failed, using mock response:', error)
    }
    
    // Mock delete response
    return NextResponse.json({
      deleted_files: fileIds.length,
      message: `Successfully deleted ${fileIds.length} files`
    })
    
  } catch (error) {
    console.error('Error deleting audio files:', error)
    return NextResponse.json(
      { error: 'Failed to delete files' },
      { status: 500 }
    )
  }
}
