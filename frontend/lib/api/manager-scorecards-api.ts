/**
 * API service for manager scorecards
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_SCORING_API_URL || "http://localhost:8000/api/v1"

export interface ManagerScorecard {
  unique_id: string
  manager_name: string
  calls: number
  flag_calls: number
  red_flags: number
  dismissed: number
  avg_duration: number
  avg_score: number
  compliance: number
  hostile_approach: number
  objection_handling: number
  empathy_deficit: number
  timestamp: string
}

export interface ManagerStats {
  total_entries: number
  avg_calls: number
  avg_performance_score: number
  avg_compliance: number
  avg_hostile_approach: number
  avg_objection_handling: number
  avg_empathy_deficit: number
  first_entry: string
  last_entry: string
}

export interface CreateScorecardData {
  manager_name: string
  calls: number
  flagCalls: number
  redFlags: number
  dismissed: number
  avgDuration: number
  avgScore: number
  compliance: number
  hostileApproach: number
  objectionHandling: number
  empathyDeficit: number
}

class ManagerScorecardsAPI {
  private baseUrl: string

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = `${baseUrl}/manager-scorecards`
  }

  /**
   * Get all manager names
   */
  async getAllManagers(): Promise<string[]> {
    const response = await fetch(`${this.baseUrl}/managers`)
    if (!response.ok) {
      throw new Error(`Failed to fetch managers: ${response.statusText}`)
    }
    return response.json()
  }

  /**
   * Get latest scorecards across all managers
   */
  async getLatestScorecards(limit: number = 100): Promise<ManagerScorecard[]> {
    const response = await fetch(`${this.baseUrl}/latest?limit=${limit}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch latest scorecards: ${response.statusText}`)
    }
    return response.json()
  }

  /**
   * Get scorecards for a specific manager
   */
  async getManagerScorecards(managerName: string, limit: number = 50): Promise<ManagerScorecard[]> {
    const encodedName = encodeURIComponent(managerName)
    const response = await fetch(`${this.baseUrl}/manager/${encodedName}?limit=${limit}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch scorecards for ${managerName}: ${response.statusText}`)
    }
    return response.json()
  }

  /**
   * Get aggregate statistics for a manager
   */
  async getManagerStats(managerName: string): Promise<ManagerStats> {
    const encodedName = encodeURIComponent(managerName)
    const response = await fetch(`${this.baseUrl}/manager/${encodedName}/stats`)
    if (!response.ok) {
      throw new Error(`Failed to fetch stats for ${managerName}: ${response.statusText}`)
    }
    return response.json()
  }

  /**
   * Get a specific scorecard by unique_id
   */
  async getScorecard(uniqueId: string): Promise<ManagerScorecard> {
    const response = await fetch(`${this.baseUrl}/${uniqueId}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch scorecard: ${response.statusText}`)
    }
    return response.json()
  }

  /**
   * Create a new scorecard
   */
  async createScorecard(data: CreateScorecardData): Promise<{ unique_id: string; message: string }> {
    const response = await fetch(`${this.baseUrl}/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`Failed to create scorecard: ${response.statusText}`)
    }
    return response.json()
  }

  /**
   * Update an existing scorecard
   */
  async updateScorecard(uniqueId: string, data: CreateScorecardData): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/${uniqueId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
    if (!response.ok) {
      throw new Error(`Failed to update scorecard: ${response.statusText}`)
    }
    return response.json()
  }

  /**
   * Delete a scorecard
   */
  async deleteScorecard(uniqueId: string): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/${uniqueId}`, {
      method: 'DELETE',
    })
    if (!response.ok) {
      throw new Error(`Failed to delete scorecard: ${response.statusText}`)
    }
    return response.json()
  }

  /**
   * Seed the database with sample data (for development)
   */
  async seedDatabase(): Promise<{ message: string }> {
    const response = await fetch(`${this.baseUrl}/seed`, {
      method: 'POST',
    })
    if (!response.ok) {
      throw new Error(`Failed to seed database: ${response.statusText}`)
    }
    return response.json()
  }
}

// Export a singleton instance
export const managerScorecardsAPI = new ManagerScorecardsAPI()

// Export the class for custom instances
export { ManagerScorecardsAPI }
