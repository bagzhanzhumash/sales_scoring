import type { Metadata } from "next"
import { DashboardClient } from "@/components/dashboard/dashboard-client"
import { statsApi } from "@/lib/api/stats-api"
import { QueryProvider } from "@/components/providers/query-provider"

export const metadata: Metadata = {
  title: "Dashboard - Speech Analytics",
  description: "Real-time analytics dashboard for speech analysis projects",
}

// Server Component - Initial server-side data fetching
export default async function DashboardPage() {
  try {
    const initialStats = await statsApi.getDashboardStats()

    return (
      <QueryProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
          <DashboardClient initialData={initialStats} />
        </div>
      </QueryProvider>
    )
  } catch (error) {
    console.error("Failed to load dashboard data:", error)

    return (
      <QueryProvider>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
          <DashboardClient initialData={null} />
        </div>
      </QueryProvider>
    )
  }
}
