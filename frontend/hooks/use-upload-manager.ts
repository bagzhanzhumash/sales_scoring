"use client"

import { useState, useCallback } from "react"
import type { UploadingFile, UploadSettings } from "@/types/upload"

export function useUploadManager() {
  const [uploads, setUploads] = useState<Map<string, UploadingFile>>(new Map())

  const addFiles = useCallback((files: FileList, settings: UploadSettings) => {
    const newUploads = Array.from(files).map((file) => ({
      id: crypto.randomUUID(),
      file,
      status: "pending" as const,
      progress: 0,
      uploadedBytes: 0,
      totalBytes: file.size,
      autoProcess: false,
      checklistId: settings.checklistId,
    }))

    setUploads((prev) => {
      const updated = new Map(prev)
      newUploads.forEach((upload) => updated.set(upload.id, upload))
      return updated
    })

    // Start uploads automatically
    newUploads.forEach((upload) => startUpload(upload.id, settings))
  }, [])

  const startUpload = useCallback(
    async (uploadId: string, settings: UploadSettings) => {
      const upload = uploads.get(uploadId)
      if (!upload || !settings.projectId) return

      setUploads((prev) => new Map(prev.set(uploadId, { ...upload, status: "uploading" })))

      try {
        // Create FormData for file upload
        const formData = new FormData()
        formData.append('files', upload.file)
        formData.append('auto_process', settings.autoProcess.toString())

        // Upload with progress tracking
        const xhr = new XMLHttpRequest()
        
        // Set up progress tracking
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100
            const uploadedBytes = event.loaded
            
        setUploads((prev) => {
          const current = prev.get(uploadId)
              if (!current) return prev

              const estimatedTimeRemaining = progress > 0 ? 
                ((100 - progress) / progress) * (Date.now() - startTime) : undefined

              return new Map(prev.set(uploadId, {
                ...current,
                progress: Math.min(progress, 99), // Keep at 99% until completion
                uploadedBytes,
                estimatedTimeRemaining
              }))
            })
          }
        }

        // Set up completion handler
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText)
              
              setUploads((prev) => new Map(prev.set(uploadId, {
                ...prev.get(uploadId)!,
                status: "completed",
                progress: 100,
                uploadedBytes: upload.totalBytes,
                estimatedTimeRemaining: 0
              })))
              
              // If auto-processing, monitor the processing status
              if (settings.autoProcess && response.processing_started) {
                monitorProcessingStatus(uploadId, response.uploaded_files?.[0]?.id)
          }

            } catch (error) {
              console.error('Failed to parse upload response:', error)
              setUploads((prev) => new Map(prev.set(uploadId, {
                ...prev.get(uploadId)!,
                status: "failed",
                error: "Invalid response from server"
              })))
            }
          } else {
            setUploads((prev) => new Map(prev.set(uploadId, {
              ...prev.get(uploadId)!,
              status: "failed",
              error: `Upload failed: ${xhr.statusText}`
            })))
          }
        }

        // Set up error handler
        xhr.onerror = () => {
          setUploads((prev) => new Map(prev.set(uploadId, {
            ...prev.get(uploadId)!,
            status: "failed",
            error: "Network error during upload"
          })))
        }

        const startTime = Date.now()
        
        // Start the upload
        xhr.open('POST', `/api/v1/projects/${settings.projectId}/files`)
        xhr.send(formData)

      } catch (error) {
        console.error('Upload error:', error)
        setUploads((prev) => new Map(prev.set(uploadId, {
          ...prev.get(uploadId)!,
          status: "failed",
          error: error instanceof Error ? error.message : "Upload failed"
        })))
      }
    },
    [uploads],
  )

  const monitorProcessingStatus = useCallback(async (uploadId: string, fileId?: string) => {
    if (!fileId) return

    // Poll for processing status every 2 seconds
    const checkStatus = async () => {
      try {
        const response = await fetch(`/api/v1/files/${fileId}/status`)
        if (response.ok) {
          const data = await response.json()
          
          setUploads((prev) => {
            const current = prev.get(uploadId)
            if (!current) return prev
            
            let status: UploadingFile['status'] = current.status
            let progress = current.progress
            
            // Map backend status to frontend status
            switch (data.status) {
              case 'processing':
              case 'transcribing':
              case 'analyzing':
                status = "processing"
                progress = Math.min(data.progress || 50, 99)
                break
              case 'completed':
                status = "completed" 
                progress = 100
                break
              case 'failed':
                status = "failed"
                break
            }
            
            return new Map(prev.set(uploadId, {
              ...current,
              status,
              progress,
              error: data.error_message
            }))
          })
          
          // Continue polling if still processing
          if (data.status === 'processing' || data.status === 'transcribing' || data.status === 'analyzing') {
            setTimeout(checkStatus, 2000)
          }
        }
      } catch (error) {
        console.error('Failed to check processing status:', error)
      }
    }
    
    // Start monitoring after a short delay
    setTimeout(checkStatus, 1000)
  }, [])

  const pauseUpload = useCallback((uploadId: string) => {
    setUploads((prev) => {
      const upload = prev.get(uploadId)
      if (!upload) return prev
      return new Map(prev.set(uploadId, { ...upload, status: "paused" }))
    })
  }, [])

  const resumeUpload = useCallback((uploadId: string) => {
    setUploads((prev) => {
      const upload = prev.get(uploadId)
      if (!upload) return prev
      return new Map(prev.set(uploadId, { ...upload, status: "uploading" }))
    })
  }, [])

  const cancelUpload = useCallback((uploadId: string) => {
    setUploads((prev) => {
      const upload = prev.get(uploadId)
      if (!upload) return prev
      return new Map(prev.set(uploadId, { ...upload, status: "cancelled" }))
    })
  }, [])

  const retryUpload = useCallback((uploadId: string) => {
    setUploads((prev) => {
      const upload = prev.get(uploadId)
      if (!upload) return prev
      return new Map(prev.set(uploadId, { ...upload, status: "pending", progress: 0, uploadedBytes: 0 }))
    })
  }, [])

  const clearCompleted = useCallback(() => {
    setUploads((prev) => {
      const updated = new Map()
      prev.forEach((upload, id) => {
        if (upload.status !== "completed") {
          updated.set(id, upload)
        }
      })
      return updated
    })
  }, [])

  const clearAll = useCallback(() => {
    setUploads(new Map())
  }, [])

  const globalProgress =
    Array.from(uploads.values()).reduce((acc, upload) => acc + upload.progress, 0) / uploads.size || 0

  return {
    uploads: Array.from(uploads.values()),
    globalProgress,
    addFiles,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    retryUpload,
    clearCompleted,
    clearAll,
  }
}
