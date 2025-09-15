import type { Metadata } from "next"
import { UploadClient } from "@/components/upload/upload-client"
import { QueryProvider } from "@/components/providers/query-provider"

export const metadata: Metadata = {
  title: "Upload Files - Speech Analytics",
  description: "Upload audio files for speech analysis with AI-powered checklists",
}

export default function UploadPage() {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800">
        <UploadClient />
      </div>
    </QueryProvider>
  )
}
