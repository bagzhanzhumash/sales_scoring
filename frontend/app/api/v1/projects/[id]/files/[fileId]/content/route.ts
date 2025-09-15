import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id: projectId, fileId } = await params
    
    // Get the backend API URL
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7777'
    
    // Try to fetch the file content from the backend
    const backendResponse = await fetch(
      `${backendUrl}/api/v1/audio-files/${fileId}/content`,
      {
        method: 'GET',
        headers: {
          'Accept': '*/*',
        },
      }
    )

    if (!backendResponse.ok) {
      // If the audio files endpoint doesn't work, try alternative endpoints
      const alternativeResponse = await fetch(
        `${backendUrl}/api/v1/files/${fileId}/download`,
        {
          method: 'GET',
          headers: {
            'Accept': '*/*',
          },
        }
      )
      
      if (!alternativeResponse.ok) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        )
      }
      
      // Stream the alternative response
      const contentType = alternativeResponse.headers.get('content-type') || 'application/octet-stream'
      const content = await alternativeResponse.arrayBuffer()
      
      return new NextResponse(content, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': alternativeResponse.headers.get('content-disposition') || 'inline',
        },
      })
    }

    // Stream the file content from backend to frontend
    const contentType = backendResponse.headers.get('content-type') || 'application/octet-stream'
    const content = await backendResponse.arrayBuffer()
    
    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': backendResponse.headers.get('content-disposition') || 'inline',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error) {
    console.error('Error serving file content:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  try {
    const { id: projectId, fileId } = await params
    
    const backendUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7777'
    
    const backendResponse = await fetch(
      `${backendUrl}/api/v1/audio-files/${fileId}/content`,
      {
        method: 'HEAD',
      }
    )

    if (!backendResponse.ok) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    return new NextResponse(null, {
      status: 200,
      headers: {
        'Content-Type': backendResponse.headers.get('content-type') || 'application/octet-stream',
        'Content-Length': backendResponse.headers.get('content-length') || '0',
      },
    })
  } catch (error) {
    console.error('Error checking file:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 