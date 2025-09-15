import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ResultsClient } from "@/components/results/results-client"
import { projectsApi } from "@/lib/api/projects-api"
import { QueryProvider } from "@/components/providers/query-provider"

interface ProjectResultsPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProjectResultsPageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params
    const project = await projectsApi.getProject(resolvedParams.id)
    return {
      title: `${project.name} Results - Speech Analytics`,
      description: `Analysis results for ${project.name}`,
    }
  } catch {
    return {
      title: "Project Results - Speech Analytics",
      description: "Analysis results for this project",
    }
  }
}

export default async function ProjectResultsPage({ params }: ProjectResultsPageProps) {
  try {
    const resolvedParams = await params
    const [project, results] = await Promise.all([
      projectsApi.getProject(resolvedParams.id),
      projectsApi.getProjectResults(resolvedParams.id),
    ])

    return (
      <QueryProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <ResultsClient projectId={resolvedParams.id} initialProject={project} initialResults={results} />
        </div>
      </QueryProvider>
    )
  } catch (error) {
    console.error("Failed to load project results:", error)
    notFound()
  }
}
