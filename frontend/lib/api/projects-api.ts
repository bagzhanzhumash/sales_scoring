import type {
  Project,
  ProjectListResponse,
  ProjectStats,
  CreateProjectData,
  AudioFile,
  AnalysisResult,
  ProjectAnalytics,
} from "@/types/projects"

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

interface GetProjectsParams {
  page?: number
  limit?: number
  status?: string
  search?: string
  sortBy?: string
  sortOrder?: string
  dateRange?: string
  offset?: number
  status_filter?: string
}

class ProjectsAPI {
  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const fullUrl = `${API_BASE_URL}${endpoint}`
    
    try {
      // For FormData uploads, don't set Content-Type header
      const headers = options.body instanceof FormData 
        ? { ...options.headers }
        : {
            "Content-Type": "application/json",
            ...options.headers,
          }

      const response = await fetch(fullUrl, {
        ...options,
        headers,
      })

      if (!response.ok) {
        let errorText = ""
        try {
          errorText = await response.text()
        } catch {
          errorText = `${response.status} ${response.statusText}`
        }
        console.error(`API Error ${response.status} for ${fullUrl}:`, errorText)
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      const contentType = response.headers.get("content-type")
      if (contentType && contentType.includes("application/json")) {
        return response.json()
      } else {
        return response.text()
      }
    } catch (error) {
      console.error(`Failed to fetch ${fullUrl}:`, error)
      throw error
    }
  }

  async getProjects(params: GetProjectsParams = {}): Promise<ProjectListResponse> {
    const searchParams = new URLSearchParams()

    // Map frontend params to backend params
    if (params.limit) searchParams.append("limit", params.limit.toString())
    if (params.page) {
      const offset = (params.page - 1) * (params.limit || 20)
      searchParams.append("offset", offset.toString())
    }
    if (params.status && params.status !== "all") {
      searchParams.append("status_filter", params.status)
    }

    // Use the backend endpoint with trailing slash
    const response = await this.fetchWithAuth(`/api/v1/projects/?${searchParams.toString()}`)
    
    // Transform backend response to frontend format
    return {
      projects: response.items || [], // Backend uses "items", frontend expects "projects"
      total: response.total || 0,
      page: params.page || 1,
      pages: Math.ceil((response.total || 0) / (params.limit || 20)),
      has_next: response.has_next || false,
      has_previous: response.has_previous || false,
    }
  }

  async getProject(id: string): Promise<Project> {
    return this.fetchWithAuth(`/api/v1/projects/${id}`)
  }

  async getProjectFiles(id: string): Promise<AudioFile[]> {
    // Use the correct backend endpoint for audio files
    const response = await this.fetchWithAuth(`/api/v1/audio-files/projects/${id}`)
    return response.items || []
  }

  async getProjectResults(id: string): Promise<AnalysisResult[]> {
    // Use the correct backend endpoint for results
    const response = await this.fetchWithAuth(`/api/v1/results/projects/${id}`)
    // Backend returns {project_info, checklist_structure, results}, we need just the results array
    return response.results || []
  }

  async getProjectAnalytics(id: string): Promise<ProjectAnalytics> {
    // Use the correct backend endpoint for analytics
    return this.fetchWithAuth(`/api/v1/statistics/projects/${id}/overview`)
  }

  async createProject(data: CreateProjectData): Promise<Project> {
    return this.fetchWithAuth("/api/v1/projects/", {
      method: "POST",
      body: JSON.stringify(data),
    })
  }

  async updateProject(id: string, data: Partial<CreateProjectData>): Promise<Project> {
    return this.fetchWithAuth(`/api/v1/projects/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    })
  }

  async deleteProject(id: string): Promise<void> {
    return this.fetchWithAuth(`/api/v1/projects/${id}`, {
      method: "DELETE",
    })
  }

  async getProjectStats(): Promise<ProjectStats> {
    // Since backend doesn't have /projects/stats, use dashboard stats
    try {
      const dashboardStats = await this.fetchWithAuth("/api/v1/statistics/dashboard")
      
      // Transform dashboard stats to project stats format
      return {
        total_projects: dashboardStats.overview?.total_projects || 0,
        active_projects: dashboardStats.overview?.active_projects || 0,
        completed_today: dashboardStats.recent_activity?.recent_completions || 0,
        total_files: dashboardStats.overview?.total_files || 0,
        average_accuracy: dashboardStats.overview?.overall_average_score || 0,
        processing_hours_saved: 0 // Backend doesn't provide this yet
      }
    } catch (error) {
      // Return mock data if stats endpoint fails
      return {
        total_projects: 0,
        active_projects: 0,
        completed_today: 0,
        total_files: 0,
        average_accuracy: 0,
        processing_hours_saved: 0
      }
    }
  }

  async bulkDelete(ids: string[]): Promise<void> {
    // Bulk operations not implemented in backend yet, do individual deletes
    await Promise.all(ids.map(id => this.deleteProject(id)))
  }

  async bulkArchive(ids: string[]): Promise<void> {
    // Archive not implemented in backend yet
    console.warn("Bulk archive not implemented in backend")
  }

  async bulkExport(ids: string[]): Promise<void> {
    // Export multiple projects (not implemented in backend yet)
    console.warn("Bulk export not implemented in backend") 
  }

  async uploadFiles(projectId: string, files: FileList) {
    const formData = new FormData()
    Array.from(files).forEach((file) => formData.append("files", file))
    
    return this.fetchWithAuth(`/api/v1/audio-files/projects/${projectId}/upload`, {
      method: "POST",
      body: formData,
    })
  }

  async getAllResults(filters: any = {}): Promise<AnalysisResult[]> {
    // Global results endpoint doesn't exist, return empty for now
    console.warn("Global results endpoint not implemented in backend")
    return []
  }
}

const projectsApiInstance = new ProjectsAPI()

export const projectsApi = {
  getProjects: (params?: GetProjectsParams) => projectsApiInstance.getProjects(params),
  getProject: (id: string) => projectsApiInstance.getProject(id),
  getProjectFiles: (id: string) => projectsApiInstance.getProjectFiles(id),
  getProjectResults: (id: string) => projectsApiInstance.getProjectResults(id),
  getProjectAnalytics: (id: string) => projectsApiInstance.getProjectAnalytics(id),
  createProject: (data: CreateProjectData) => projectsApiInstance.createProject(data),
  updateProject: (id: string, data: Partial<CreateProjectData>) => projectsApiInstance.updateProject(id, data),
  deleteProject: (id: string) => projectsApiInstance.deleteProject(id),
  getProjectStats: () => projectsApiInstance.getProjectStats(),
  bulkDelete: (ids: string[]) => projectsApiInstance.bulkDelete(ids),
  bulkArchive: (ids: string[]) => projectsApiInstance.bulkArchive(ids),
  bulkExport: (ids: string[]) => projectsApiInstance.bulkExport(ids),
  uploadFiles: (projectId: string, files: FileList) => projectsApiInstance.uploadFiles(projectId, files),
  getAllResults: (filters?: any) => projectsApiInstance.getAllResults(filters),
}
