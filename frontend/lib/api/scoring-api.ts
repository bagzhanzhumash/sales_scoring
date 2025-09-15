interface ScoreUpdateRequest {
  category_id: string
  criterion_id: string
  score: number | string
  comment?: string
}

interface AnalysisRequest {
  checklist_id: string
  force_reanalysis?: boolean
  use_ai_analysis?: boolean
  ai_model?: string
  temperature?: number
}

interface AnalysisResponse {
  id: string
  transcription_id: string
  checklist_id: string
  categories: CategoryScore[]
  overall_score: number
  max_possible_score: number
  percentage: number
  status: string
  is_manually_edited: boolean
  avg_confidence?: number
  processed_at: string
  created_at: string
  updated_at: string
}

interface CategoryScore {
  category_id: string
  category_name: string
  scores: CriterionScore[]
  total_score: number
  max_score: number
  percentage: number
}

interface CriterionScore {
  criterion_id: string
  score: number | string | null
  max_score: number
  confidence?: number
  reasoning?: string
  manual_override: boolean
}

class ScoringApiClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl
  }

  /**
   * Start analysis for a transcription
   */
  async analyzeTranscription(
    transcriptionId: string,
    request: AnalysisRequest,
    background: boolean = false
  ): Promise<any> {
    const url = `${this.baseUrl}/analysis/transcriptions/${transcriptionId}?background=${background}`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Get analysis status for a transcription
   */
  async getAnalysisStatus(transcriptionId: string): Promise<any> {
    const url = `${this.baseUrl}/analysis/transcriptions/${transcriptionId}/status`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Update individual criterion score
   */
  async updateCriterionScore(
    analysisId: string,
    scoreUpdate: ScoreUpdateRequest
  ): Promise<any> {
    const url = `${this.baseUrl}/analysis/results/${analysisId}/scores`
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scoreUpdate),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Get task status for background processing
   */
  async getTaskStatus(taskId: string): Promise<any> {
    const url = `${this.baseUrl}/analysis/tasks/${taskId}`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Get project analysis summary
   */
  async getProjectAnalysisSummary(projectId: string): Promise<any> {
    const url = `${this.baseUrl}/analysis/projects/${projectId}/summary`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Analyze entire project batch
   */
  async analyzeProjectBatch(
    projectId: string,
    request: { checklist_id: string; force_reanalysis?: boolean; max_concurrent?: number }
  ): Promise<any> {
    const url = `${this.baseUrl}/analysis/projects/${projectId}/batch`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }

  /**
   * Get analysis health check
   */
  async healthCheck(): Promise<any> {
    const url = `${this.baseUrl}/analysis/health`
    
    const response = await fetch(url)
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    return response.json()
  }
}

// Export singleton instance
export const scoringApi = new ScoringApiClient()

// Export types
export type {
  ScoreUpdateRequest,
  AnalysisRequest,
  AnalysisResponse,
  CategoryScore,
  CriterionScore
} 