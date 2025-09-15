"use client"

import { Clock } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { AudioFile, AnalysisResult, ProjectUpdate } from "@/types/projects"

interface RecentActivityTimelineProps {
  wsUpdates: ProjectUpdate[]
  files: AudioFile[]
  results: AnalysisResult[]
}

export function RecentActivityTimeline({ wsUpdates, files, results }: RecentActivityTimelineProps) {
  const activities = [
    ...wsUpdates.map((u, index) => ({ id: `update-${index}`, label: u.message, time: u.timestamp })),
    ...files.slice(0, 5).map((f) => ({ id: `file-${f.id}`, label: `File ${f.name} ${f.status}`, time: f.upload_date })),
    ...results.slice(0, 5).map((r) => ({ id: `result-${r.id}`, label: `Result for ${r.file_name}`, time: r.updated_at })),
  ]
    .filter((a) => a.time) // Filter out activities without timestamps
    .sort((a, b) => new Date(b.time!).getTime() - new Date(a.time!).getTime())
    .slice(0, 8)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-64 overflow-auto">
        {activities.length === 0 ? (
          <p className="text-center text-sm text-slate-500 pt-8">No activity yet</p>
        ) : (
          activities.map((a) => (
            <div key={a.id} className="flex items-start space-x-3">
              <Clock className="w-4 h-4 mt-0.5 text-slate-400" />
              <div>
                <p className="text-sm text-slate-700 dark:text-slate-300">{a.label}</p>
                <span className="text-xs text-slate-500">
                  {a.time ? new Date(a.time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "Unknown time"}
                </span>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
