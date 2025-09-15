export interface Project {
  id: string
  name: string
  description?: string
  client_name?: string
  status: "created" | "active" | "completed" | "pending" | "failed"
  checklist_id?: string
  total_files: number
  processed_files: number
  average_score?: number | null
  files_count: number
  completion_percentage: number
  created_at: string
  updated_at: string
  // Legacy fields for backward compatibility
  audio_files_count?: number
  completed_files_count?: number
  pending_files_count?: number
  average_accuracy?: number
  checklist_name?: string
  creator_name?: string
}

export interface AudioFile {
  id: string
  name: string
  size: number
  duration?: number
  status: "pending" | "processing" | "completed" | "failed"
  upload_date: string
  processing_started_at?: string
  processing_completed_at?: string
  error_message?: string
  progress?: number
  // Additional fields for comprehensive management
  file_path?: string
  mime_type?: string
  sample_rate?: number
  channels?: number
  bitrate?: number
  format?: string
  transcription_id?: string
  analysis_id?: string
  manager_name?: string
  client_name?: string
  call_type?: string
  quality_score?: number
  is_deleted?: boolean
  deleted_at?: string
}

export interface AnalysisResult {
  audio_file_id: string
  column_number?: number
  filename: string
  manager_name?: string
  status: "completed" | "failed" | "pending"
  total_score?: number
  max_possible_score?: number
  percentage?: number
  categories?: Record<string, any>
  comments?: Record<string, any>
  processed_at?: string
  is_manually_edited?: boolean
  // Legacy fields for backward compatibility
  id?: string
  file_id?: string
  file_name?: string
  overall_score?: number
  accuracy?: number
  criteria_scores?: Record<string, number>
  confidence_scores?: Record<string, number>
  notes?: string
  created_at?: string
  updated_at?: string
}

export interface ProjectAnalytics {
  accuracy_trend: Array<{
    date: string
    accuracy: number
    file_count: number
  }>
  processing_time_trend: Array<{
    date: string
    avg_processing_time: number
    file_count: number
  }>
  criteria_performance: Record<
    string,
    {
      average_score: number
      pass_rate: number
      trend: "up" | "down" | "stable"
    }
  >
}

export interface ProjectListResponse {
  projects: Project[]
  total: number
  page: number
  pages: number
  has_next: boolean
  has_previous: boolean
}

export interface ProjectStats {
  total_projects: number
  active_projects: number
  completed_today: number
  total_files: number
  average_accuracy: number
  processing_hours_saved: number
}

export interface CreateProjectData {
  name: string
  description?: string
  checklist_id?: string
}

export interface ProjectUpdate {
  type: "file_uploaded" | "processing_started" | "analysis_completed" | "export_ready" | "project_updated"
  timestamp: string
  data: any
  message: string
}

// Checklist Types
export interface ChecklistCriterion {
  id?: string
  text: string
  description?: string
  type: "binary" | "scale" | "text" | "percentage"
  max_score: number
  weight?: number
  is_required?: boolean
}

export interface ChecklistCategory {
  id?: string
  name: string
  description?: string
  max_score: number
  weight: number
  criteria: ChecklistCriterion[]
}

export interface Checklist {
  id: string
  name: string
  description?: string
  industry?: string
  categories: ChecklistCategory[]
  total_criteria_count: number
  categories_count: number
  max_possible_score: number
  is_template: boolean
  template_tags?: string[]
  usage_count: number
  last_used_at?: string
  version: string
  parent_checklist_id?: string
  is_active: boolean
  validation_errors?: string[]
  created_at: string
  updated_at: string
}

export interface ChecklistTemplate {
  id: string
  name: string
  description: string
  industry: string
  categories: ChecklistCategory[]
}

export interface ChecklistCreateRequest {
  name: string
  description?: string
  industry?: string
  categories: ChecklistCategory[]
  is_template?: boolean
  template_tags?: string[]
  version?: string
  parent_checklist_id?: string
}

export interface ChecklistUpdateRequest {
  name?: string
  description?: string
  categories?: ChecklistCategory[]
  is_active?: boolean
}

// Export functionality types
export interface ExportRequest {
  project_id?: string
  file_ids?: string[]
  format: "excel" | "csv" | "json" | "pdf"
  template: "standard" | "detailed" | "summary"
  include_transcripts?: boolean
  include_analysis?: boolean
  include_audio_metadata?: boolean
  date_range?: {
    start: string
    end: string
  }
}

export interface ExportResponse {
  id: string
  status: "pending" | "processing" | "completed" | "failed"
  download_url?: string
  file_name?: string
  file_size?: number
  created_at: string
  completed_at?: string
  error_message?: string
  expires_at?: string
}

// Audio processing types
export interface AudioProcessingRequest {
  file_ids: string[]
  options?: {
    force_reprocess?: boolean
    priority?: "low" | "normal" | "high"
    transcription_language?: string
    analysis_checklist_id?: string
  }
}

export interface AudioProcessingResponse {
  task_id: string
  status: "queued" | "processing" | "completed" | "failed"
  message: string
  processed_files: number
  total_files: number
  estimated_completion?: string
}

// Bulk operations
export interface BulkOperationRequest {
  action: "delete" | "reprocess" | "export" | "move" | "tag"
  file_ids: string[]
  options?: Record<string, any>
}

export interface BulkOperationResponse {
  operation_id: string
  status: "pending" | "processing" | "completed" | "failed"
  total_items: number
  processed_items: number
  failed_items: number
  errors?: Array<{
    file_id: string
    error: string
  }>
}
