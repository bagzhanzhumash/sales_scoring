/**
 * Scoring API client for speech analytics platform
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7777/api/v1'

export interface AudioFileUpload {
  file: File
  project_id?: string
}

export interface TranscriptionRequest {
  audio_file_id: string
  language?: string
  model_version?: string
  temperature?: number
}

export interface AnalysisRequest {
  transcription_id: string
  checklist_id: string
  force_reanalysis?: boolean
}

export interface BatchAnalysisRequest {
  transcription_ids: string[]
  checklist_id: string
  max_concurrent?: number
}

export interface ReadyTranscriptionUploadRequest {
  audio_file_id: string
  text: string
  language?: string
}

// Audio file operations
export async function uploadAudioFile(projectId: string, file: File): Promise<any> {
  const formData = new FormData()
  formData.append('files', file)
  formData.append('project_id', projectId)

  const response = await fetch(`${API_BASE_URL}/audio-files/projects/${projectId}/upload`, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    throw new Error(`Upload failed: ${response.statusText}`)
  }

  return response.json()
}

export async function uploadMultipleAudioFiles(projectId: string, files: File[]): Promise<any> {
  const formData = new FormData()
  files.forEach(file => formData.append('files', file))
  formData.append('project_id', projectId)

  const response = await fetch(`${API_BASE_URL}/audio-files/projects/${projectId}/batch-upload`, {
    method: 'POST',
    body: formData
  })

  if (!response.ok) {
    throw new Error(`Batch upload failed: ${response.statusText}`)
  }

  return response.json()
}

export async function getAudioFileStatus(fileId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/audio-files/${fileId}/status`)
  
  if (!response.ok) {
    throw new Error(`Failed to get file status: ${response.statusText}`)
  }

  return response.json()
}

// Transcription operations
export async function createTranscription(request: TranscriptionRequest): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/transcription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request)
  })

  if (!response.ok) {
    throw new Error(`Transcription failed: ${response.statusText}`)
  }

  return response.json()
}

export async function getTranscription(transcriptionId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/transcription/${transcriptionId}`)
  
  if (!response.ok) {
    throw new Error(`Failed to get transcription: ${response.statusText}`)
  }

  return response.json()
}

export async function batchTranscription(audioFileIds: string[], options: any = {}): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/transcription/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      audio_file_ids: audioFileIds,
      ...options
    })
  })

  if (!response.ok) {
    throw new Error(`Batch transcription failed: ${response.statusText}`)
  }

  return response.json()
}

// Analysis operations
export async function analyzeTranscription(transcriptionId: string, checklistId: string, background = false): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/analysis/transcriptions/${transcriptionId}?background=${background}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      checklist_id: checklistId,
      force_reanalysis: false
    })
  })

  if (!response.ok) {
    throw new Error(`Analysis failed: ${response.statusText}`)
  }

  return response.json()
}

export async function batchAnalyze(
  projectId: string,
  checklistId: string,
  transcriptionIds: string[],
  options: Partial<{
    force_reanalysis: boolean
    use_ai_analysis: boolean
    ai_model: string
    temperature: number
    max_concurrent: number
  }> = {}
): Promise<any> {
  const body = {
    checklist_id: checklistId,
    transcription_ids: transcriptionIds,
    force_reanalysis: options.force_reanalysis ?? false,
    use_ai_analysis: options.use_ai_analysis ?? true,
    ai_model: options.ai_model ?? "gpt-4",
    temperature: options.temperature ?? 0.0,
    max_concurrent: options.max_concurrent ?? 3
  }

  const response = await fetch(`${API_BASE_URL}/analysis/projects/${projectId}/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  })

  if (!response.ok) throw new Error(`Batch analysis failed: ${response.statusText}`)
  return response.json()
}

export async function getAnalysisStatus(transcriptionId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/analysis/transcriptions/${transcriptionId}/status`)
  
  if (!response.ok) {
    throw new Error(`Failed to get analysis status: ${response.statusText}`)
  }

  return response.json()
}

// Project operations
export async function createProject(name: string, description?: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name,
      description
    })
  })

  if (!response.ok) {
    throw new Error(`Project creation failed: ${response.statusText}`)
  }

  return response.json()
}

export async function getProject(projectId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/projects/${projectId}`)
  
  if (!response.ok) {
    throw new Error(`Failed to get project: ${response.statusText}`)
  }

  return response.json()
}

export async function getProjectFiles(projectId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/audio-files/projects/${projectId}`)
  
  if (!response.ok) {
    throw new Error(`Failed to get project files: ${response.statusText}`)
  }

  return response.json()
}

export async function getProjectResults(projectId: string, includeTranscripts = false): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/results/projects/${projectId}?include_transcripts=${includeTranscripts}`)
  
  if (!response.ok) {
    throw new Error(`Failed to get project results: ${response.statusText}`)
  }

  return response.json()
}

// Checklist operations
export async function uploadChecklist(checklist: any): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/checklists`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(checklist)
  })

  if (!response.ok) {
    throw new Error(`Checklist upload failed: ${response.statusText}`)
  }

  return response.json()
}

export async function getChecklists(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/checklists`)
  
  if (!response.ok) {
    throw new Error(`Failed to get checklists: ${response.statusText}`)
  }

  return response.json()
}

export async function getChecklist(checklistId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/checklists/${checklistId}`)
  
  if (!response.ok) {
    throw new Error(`Failed to get checklist: ${response.statusText}`)
  }

  return response.json()
}

// Task monitoring
export async function getTaskStatus(taskId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/status`)
  
  if (!response.ok) {
    throw new Error(`Failed to get task status: ${response.statusText}`)
  }

  return response.json()
}

// Export operations
export async function exportResults(projectId: string, format = 'excel', template = 'standard'): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/results/projects/${projectId}/export`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      format,
      template,
      include_transcripts: true
    })
  })

  if (!response.ok) {
    throw new Error(`Export failed: ${response.statusText}`)
  }

  return response.json()
}

// Statistics
export async function getProjectStats(projectId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/statistics/projects/${projectId}`)
  
  if (!response.ok) {
    throw new Error(`Failed to get project stats: ${response.statusText}`)
  }

  return response.json()
}

export async function getSystemStats(): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/statistics/dashboard`)
  
  if (!response.ok) {
    throw new Error(`Failed to get system stats: ${response.statusText}`)
  }

  return response.json()
}

export async function uploadReadyTranscription(request: ReadyTranscriptionUploadRequest): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/transcription/upload-ready`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  })
  if (!response.ok) throw new Error(`Ready transcription upload failed: ${response.statusText}`)
  return response.json()
} 