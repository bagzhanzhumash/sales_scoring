import type { Metadata } from "next"
import { ResultsClient } from "@/components/results/results-client"
import { QueryProvider } from "@/components/providers/query-provider"

export const metadata: Metadata = {
  title: "Analysis Results - Speech Analytics",
  description: "View, edit, and export speech analysis results across all projects",
}

export default function ResultsPage() {
  return (
    <QueryProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <ResultsClient />
      </div>
    </QueryProvider>
  )
}
