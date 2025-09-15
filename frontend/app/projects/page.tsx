import type { Metadata } from "next"
import { ProjectsClient } from "@/components/projects/projects-client"
import { projectsApi } from "@/lib/api/projects-api"
import { QueryProvider } from "@/components/providers/query-provider"

export const metadata: Metadata = {
  title: "Projects - Speech Analytics",
  description: "Manage your speech analysis projects and audio files",
}

// Server Component - Initial server-side data fetching
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  // Await searchParams as required by Next.js 15
  const params = await searchParams
  const page = Number(params.page) || 1
  const status = (params.status as string) || "all"
  const search = (params.search as string) || ""

  try {
    const [initialProjects, projectStats] = await Promise.all([
      projectsApi.getProjects({ page, status, search, limit: 20 }),
      projectsApi.getProjectStats(),
    ])

    return (
      <QueryProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <ProjectsClient
            initialData={initialProjects}
            initialStats={projectStats}
            initialFilters={{ status, search, page }}
          />
        </div>
      </QueryProvider>
    )
  } catch (error) {
    console.error("Failed to load projects data:", error)

    return (
      <QueryProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
          <ProjectsClient initialData={null} initialStats={null} initialFilters={{ status, search, page }} />
        </div>
      </QueryProvider>
    )
  }
}
