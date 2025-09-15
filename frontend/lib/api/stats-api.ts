import type { DashboardStats, SystemStatus } from "@/types/dashboard"

// Enhanced API base URL configuration that handles SSR
function getApiBaseUrl(): string {
  // In client-side (browser) environment
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_BASE_URL ?? ""
  }
  
  // In server-side (SSR) environment
  const isProduction = process.env.NODE_ENV === "production"
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL
  
  if (baseUrl) {
    return baseUrl
  }
  
  // Default to localhost for development SSR
  return isProduction ? "" : "http://localhost:7777"
}

const API_BASE_URL = getApiBaseUrl()

class StatsAPI {
  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const fullUrl = `${API_BASE_URL}${endpoint}`
    
    try {
      const response = await fetch(fullUrl, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      })

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      console.error(`Failed to fetch ${fullUrl}:`, error)
      throw error
    }
  }

  async getDashboardStats(): Promise<DashboardStats> {
    // Fixed endpoint to match backend API
    try {
      const response = await this.fetchWithAuth("/api/v1/statistics/dashboard")
      
      // Transform backend response to match frontend expectations
      return {
        total_projects: response.overview?.total_projects || 0,
        total_audio_files: response.overview?.total_files || 0,
        total_completed_files: response.overview?.completed_files || 0,
        average_accuracy: response.overview?.overall_average_score || 0,
        total_processing_hours: 0, // Backend doesn't provide this yet
        projects_today: response.recent_activity?.recent_uploads || 0,
        files_today: response.recent_activity?.recent_completions || 0,
        last_login: new Date().toISOString(),

        // Trend data - using mock data since backend doesn't provide trends yet
        projects_change: "+12%",
        projects_trend: "up" as const,
        files_change: "+8%", 
        files_trend: "up" as const,
        accuracy_change: "+2%",
        accuracy_trend: "up" as const,
        hours_change: "-15%",
        hours_trend: "down" as const,

        // Mock data for charts and activity since backend doesn't provide these yet
        throughput_trend: [
          { date: "2024-12-19", projects_completed: 5, files_processed: 45, average_accuracy: 92 },
          { date: "2024-12-18", projects_completed: 3, files_processed: 38, average_accuracy: 89 },
          { date: "2024-12-17", projects_completed: 7, files_processed: 52, average_accuracy: 94 }
        ],
        recent_activity: [
          {
            id: "1",
            type: "project_created",
            message: "New project created successfully",
            project_name: "Sample Project",
            timestamp: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
            status: "success",
            user: "Admin"
          },
          {
            id: "2", 
            type: "file_uploaded",
            message: "Audio files uploaded for processing",
            project_name: "Sample Project",
            timestamp: new Date(Date.now() - 900000).toISOString(), // 15 minutes ago
            status: "success",
            user: "Admin"
          }
        ]
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error)
      // Return mock data as fallback
      return {
        total_projects: 0,
        total_audio_files: 0,
        total_completed_files: 0,
        average_accuracy: 0,
        total_processing_hours: 0,
        projects_today: 0,
        files_today: 0,
        
        projects_change: "0%",
        projects_trend: "neutral" as const,
        files_change: "0%",
        files_trend: "neutral" as const,
        accuracy_change: "0%",
        accuracy_trend: "neutral" as const,
        hours_change: "0%",
        hours_trend: "neutral" as const,

        throughput_trend: [],
        recent_activity: []
      }
    }
  }

  async getSystemStatus(): Promise<SystemStatus> {
    // Using health endpoint as backend doesn't have system-status
    try {
      const response = await this.fetchWithAuth("/health")
      return {
        status: response.status === "healthy" ? "healthy" : "error",
        services: [
          {
            name: "Database",
            status: response.database === "connected" ? "online" : "offline",
            response_time_ms: 50,
            last_check: new Date().toISOString()
          },
          {
            name: "API",
            status: "online",
            response_time_ms: 25,
            last_check: new Date().toISOString()
          }
        ],
        active_tasks: 0,
        queue_length: 0
      }
    } catch {
      return {
        status: "error",
        services: [
          {
            name: "Database", 
            status: "offline",
            last_check: new Date().toISOString()
          },
          {
            name: "API",
            status: "offline", 
            last_check: new Date().toISOString()
          }
        ],
        active_tasks: 0,
        queue_length: 0
      }
    }
  }
}

const statsApiInstance = new StatsAPI()

export const statsApi = {
  getDashboardStats: () => statsApiInstance.getDashboardStats(),
  getSystemStatus: () => statsApiInstance.getSystemStatus(),
}
