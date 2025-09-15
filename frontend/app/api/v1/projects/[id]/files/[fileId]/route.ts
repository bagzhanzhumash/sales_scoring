import { type NextRequest, NextResponse } from "next/server"
import type { AudioFile } from "@/types/projects"

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:7777"

// Mock audio file details
const mockAudioFile: AudioFile = {
  id: "audio-1",
  name: "customer_call_001.mp3",
  size: 2457600,
  duration: 180,
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
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  try {
    if (action === 'backend') {
      // Fetch from real backend
      const response = await fetch(`${API_BASE_URL}/api/v1/projects/${params.id}/files/${params.fileId}`, {
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
    
    if (action === 'stream') {
      // Audio streaming endpoint
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/projects/${params.id}/files/${params.fileId}/stream`, {
          headers: {
            'Range': request.headers.get('range') || '',
          },
        })
        
        if (response.ok) {
          // Forward the streaming response
          const headers = new Headers()
          response.headers.forEach((value, key) => {
            headers.set(key, value)
          })
          
          return new Response(response.body, {
            status: response.status,
            headers,
          })
        }
      } catch (error) {
        console.warn('Backend streaming failed:', error)
      }
      
      // Mock audio stream URL
      return NextResponse.json({
        stream_url: `/api/v1/projects/${params.id}/files/${params.fileId}/stream`,
        duration: mockAudioFile.duration,
        format: mockAudioFile.format,
        size: mockAudioFile.size
      })
    }
    
    if (action === 'download') {
      // File download
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/projects/${params.id}/files/${params.fileId}/download`)
        
        if (response.ok) {
          const headers = new Headers()
          headers.set('Content-Disposition', `attachment; filename="${mockAudioFile.name}"`)
          headers.set('Content-Type', mockAudioFile.mime_type || 'audio/mpeg')
          
          return new Response(response.body, {
            status: 200,
            headers,
          })
        }
      } catch (error) {
        console.warn('Backend download failed:', error)
      }
      
      // Mock download URL
      return NextResponse.json({
        download_url: `/uploads/${mockAudioFile.name}`,
        expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
        file_name: mockAudioFile.name,
        file_size: mockAudioFile.size
      })
    }
    
    if (action === 'metadata') {
      // Audio metadata
      return NextResponse.json({
        id: mockAudioFile.id,
        name: mockAudioFile.name,
        size: mockAudioFile.size,
        duration: mockAudioFile.duration,
        format: mockAudioFile.format,
        mime_type: mockAudioFile.mime_type,
        sample_rate: mockAudioFile.sample_rate,
        channels: mockAudioFile.channels,
        bitrate: mockAudioFile.bitrate,
        quality_score: mockAudioFile.quality_score,
        upload_date: mockAudioFile.upload_date,
        processing_completed_at: mockAudioFile.processing_completed_at
      })
    }
    
    if (action === 'transcription') {
      // Get transcription for this file
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/transcriptions/${mockAudioFile.transcription_id}`)
        
        if (response.ok) {
          const data = await response.json()
          return NextResponse.json(data)
        }
      } catch (error) {
        console.warn('Backend transcription fetch failed:', error)
      }
      
      // Mock transcription
      return NextResponse.json({
        id: mockAudioFile.transcription_id,
        text: "Здравствуйте, меня зовут Василий, я менеджер по продажам. Сегодня я провожу консультацию с клиентом Мариной по поводу покупки автомобиля. Марина интересуется седаном в среднем ценовом сегменте...",
        confidence: 0.87,
        language: "ru",
        segments: [
          {
            start: 0.0,
            end: 3.2,
            text: "Здравствуйте, меня зовут Василий",
            confidence: 0.92
          },
          {
            start: 3.2,
            end: 8.1,
            text: "я менеджер по продажам",
            confidence: 0.89
          }
        ],
        processing_time: 15.3,
        created_at: mockAudioFile.processing_completed_at
      })
    }
    
    if (action === 'analysis') {
      // Get analysis for this file
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/analysis/${mockAudioFile.analysis_id}`)
        
        if (response.ok) {
          const data = await response.json()
          return NextResponse.json(data)
        }
      } catch (error) {
        console.warn('Backend analysis fetch failed:', error)
      }
      
      // Mock analysis
      return NextResponse.json({
        id: mockAudioFile.analysis_id,
        overall_score: 87,
        categories: [
          {
            name: "Приветствие и представление",
            score: 95,
            max_score: 100,
            criteria: [
              {
                name: "Поприветствовал клиента",
                score: 1,
                max_score: 1,
                reasoning: "Менеджер вежливо поприветствовал клиента"
              },
              {
                name: "Представился",
                score: 1,
                max_score: 1,
                reasoning: "Менеджер назвал свое имя и должность"
              }
            ]
          }
        ],
        confidence: 0.87,
        created_at: mockAudioFile.processing_completed_at
      })
    }
    
    // Default: return file details
    return NextResponse.json(mockAudioFile)
    
  } catch (error) {
    console.error('Error fetching audio file:', error)
    return NextResponse.json(
      { error: 'Failed to fetch audio file' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  
  try {
    const body = await request.json()
    
    if (action === 'reprocess') {
      // Reprocess audio file
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/projects/${params.id}/files/${params.fileId}/reprocess`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        })
        
        if (response.ok) {
          const data = await response.json()
          return NextResponse.json(data)
        }
      } catch (error) {
        console.warn('Backend reprocess failed, using mock response:', error)
      }
      
      // Mock reprocess response
      return NextResponse.json({
        task_id: `reprocess-${Date.now()}`,
        status: "queued",
        message: "File queued for reprocessing",
        estimated_completion: new Date(Date.now() + 5 * 60 * 1000).toISOString()
      })
    }
    
    if (action === 'metadata') {
      // Update file metadata
      const updatedFile = {
        ...mockAudioFile,
        ...body,
        updated_at: new Date().toISOString()
      }
      
      return NextResponse.json(updatedFile)
    }
    
    // Default: update file
    const updatedFile = {
      ...mockAudioFile,
      ...body,
      updated_at: new Date().toISOString()
    }
    
    return NextResponse.json(updatedFile)
    
  } catch (error) {
    console.error('Error updating audio file:', error)
    return NextResponse.json(
      { error: 'Failed to update audio file' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; fileId: string } }
) {
  try {
    // Try backend first
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/projects/${params.id}/files/${params.fileId}`, {
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
    
    // Mock delete response
    return NextResponse.json({
      message: `File ${params.fileId} deleted successfully`,
      deleted_at: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Error deleting audio file:', error)
    return NextResponse.json(
      { error: 'Failed to delete audio file' },
      { status: 500 }
    )
  }
} 