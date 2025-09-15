import { NextRequest, NextResponse } from "next/server"

// Simulate processing progress over time
function getProcessingStatus(fileId: string) {
  // Use file ID to create consistent but varying progress
  const hash = fileId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0)
    return a & a
  }, 0)
  
  const currentTime = Date.now()
  const timeElapsed = (currentTime % 60000) / 1000 // Reset every minute for demo
  
  // Simulate processing stages
  if (timeElapsed < 10) {
    return {
      status: 'processing',
      progress: Math.min(Math.floor(timeElapsed * 3), 30),
      stage: 'uploading',
      message: 'Uploading file...'
    }
  } else if (timeElapsed < 30) {
    return {
      status: 'transcribing', 
      progress: Math.min(30 + Math.floor((timeElapsed - 10) * 2), 70),
      stage: 'transcription',
      message: 'Converting speech to text...'
    }
  } else if (timeElapsed < 45) {
    return {
      status: 'analyzing',
      progress: Math.min(70 + Math.floor((timeElapsed - 30) * 2), 95),
      stage: 'analysis',
      message: 'Running AI analysis...'
    }
  } else {
    return {
      status: 'completed',
      progress: 100,
      stage: 'completed',
      message: 'Processing completed successfully'
    }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { fileId: string } }
) {
  try {
    const fileId = params.fileId
    
    // Try backend first
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL
    if (API_BASE_URL) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/files/${fileId}/status`)
        if (response.ok) {
          const data = await response.json()
          return NextResponse.json(data)
        }
      } catch (error) {
        console.warn('Backend not available, using mock status:', error)
      }
    }
    
    // Return mock processing status
    const status = getProcessingStatus(fileId)
    
    return NextResponse.json({
      file_id: fileId,
      ...status,
      updated_at: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Status check error:', error)
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    )
  }
} 