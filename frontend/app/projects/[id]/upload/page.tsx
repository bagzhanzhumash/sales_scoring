import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { UploadClient } from "@/components/upload/upload-client"
import { projectsApi } from "@/lib/api/projects-api"
import { QueryProvider } from "@/components/providers/query-provider"

interface ProjectUploadPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ProjectUploadPageProps): Promise<Metadata> {
  try {
    const resolvedParams = await params
    const project = await projectsApi.getProject(resolvedParams.id)
    return {
      title: `Upload to ${project.name} - Speech Analytics`,
      description: `Upload audio files to ${project.name} for analysis`,
    }
  } catch {
    return {
      title: "Upload Files - Speech Analytics",
      description: "Upload audio files for speech analysis",
    }
  }
}

export default async function ProjectUploadPage({ params }: ProjectUploadPageProps) {
  try {
    const resolvedParams = await params
    const project = await projectsApi.getProject(resolvedParams.id)

    return (
      <QueryProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800">
          <UploadClient projectId={resolvedParams.id} initialProject={project} />
        </div>
      </QueryProvider>
    )
  } catch (error) {
    console.error("Failed to load project:", error)
    notFound()
  }
}
