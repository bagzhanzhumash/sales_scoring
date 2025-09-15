import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ProjectDetailClient } from "@/components/project-detail/project-detail-client"
import { projectsApi } from "@/lib/api/projects-api"
import { QueryProvider } from "@/components/providers/query-provider"

interface ProjectDetailPageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({ params }: ProjectDetailPageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params
    const project = await projectsApi.getProject(resolvedParams.id)
    return {
      title: `${project.name} - Speech Analytics`,
      description: project.description || `Manage ${project.name} project files and analysis results`,
    }
  } catch {
    return {
      title: "Project Not Found - Speech Analytics",
      description: "The requested project could not be found",
    }
  }
}

export default async function ProjectDetailPage({ params, searchParams }: ProjectDetailPageProps) {
  const resolvedParams = await params
  const resolvedSearchParams = await searchParams
  const activeTab = (resolvedSearchParams.tab as string) || "overview"

  try {
    const [project, files, results, analytics] = await Promise.all([
      projectsApi.getProject(resolvedParams.id),
      projectsApi.getProjectFiles(resolvedParams.id),
      projectsApi.getProjectResults(resolvedParams.id),
      projectsApi.getProjectAnalytics(resolvedParams.id),
    ])

    return (
      <QueryProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800">
          <ProjectDetailClient
            projectId={resolvedParams.id}
            initialProject={project}
            initialFiles={files}
            initialResults={results}
            initialAnalytics={analytics}
            initialTab={activeTab}
          />
        </div>
      </QueryProvider>
    )
  } catch (error) {
    console.error("Failed to load project:", error)
    notFound()
  }
}
