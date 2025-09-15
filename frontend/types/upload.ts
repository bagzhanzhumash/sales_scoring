export interface UploadingFile {
  id: string
  file: File
  status: "pending" | "uploading" | "processing" | "completed" | "failed" | "cancelled" | "paused"
  progress: number
  uploadedBytes: number
  totalBytes: number
  estimatedTimeRemaining?: number
  error?: string
  checklistId?: string
  autoProcess: boolean
  metadata?: {
    duration?: number
    format?: string
    bitrate?: string
  }
}

export interface UploadSettings {
  checklistId?: string
  model: string
  autoProcess: boolean
  confidenceThreshold: number
  notifyOnComplete: boolean
  projectId?: string
}

export interface Project {
  id: string
  name: string
  description?: string
  checklist_id?: string
  file_count?: number
}
