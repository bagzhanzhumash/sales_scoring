import { ApiResponse } from '../../types/api'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:7777'

export interface ScoreUpdateRequest {
  category_id: string
  criterion_id: string
  score: number | string  // 0, 1, or "?"
  comment?: string
}

export interface ScoreUpdateResponse {
  success: boolean
  message: string
  analysis_id: string
  category_id: string
  criterion_id: string
  new_score: number | string
  total_score: number
  score_percentage: number
  updated_at: string
}

export interface AnalysisResult {
  id: string
  transcription_id: string
  checklist_id: string
  categories: CategoryScore[]
  overall_score: number
  max_possible_score: number
  percentage: number
  status: string
  ai_model_used?: string
  processing_time_seconds?: number
  is_manually_edited: boolean
  manual_edit_count: number
  avg_confidence?: number
  low_confidence_count: number
  processed_at: string
  last_edited_at?: string
  created_at: string
  updated_at: string
}

export interface CategoryScore {
  category_id: string
  category_name: string
  scores: CriterionScore[]
  total_score: number
  max_score: number
  percentage: number
}

export interface CriterionScore {
  criterion_id: string
  score?: number | string
  max_score: number
  confidence?: number
  reasoning?: string
  manual_override: boolean
}

/**
 * Update an individual criterion score
 */
export async function updateCriterionScore(
  analysisId: string,
  scoreUpdate: ScoreUpdateRequest
): Promise<ApiResponse<ScoreUpdateResponse>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/analysis/results/${analysisId}/scores`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scoreUpdate),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error updating criterion score:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Get analysis result by ID
 */
export async function getAnalysisResult(analysisId: string): Promise<ApiResponse<AnalysisResult>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/results/${analysisId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error fetching analysis result:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Start analysis for a transcription
 */
export async function startAnalysis(
  transcriptionId: string,
  checklistId: string,
  background = false
): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/analysis/transcriptions/${transcriptionId}?background=${background}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          checklist_id: checklistId,
          force_reanalysis: false,
        }),
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error starting analysis:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
}

/**
 * Get analysis status for a transcription
 */
export async function getAnalysisStatus(transcriptionId: string): Promise<ApiResponse<any>> {
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/v1/analysis/transcriptions/${transcriptionId}/status`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    )

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    return {
      success: true,
      data,
    }
  } catch (error) {
    console.error('Error fetching analysis status:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    }
  }
} 