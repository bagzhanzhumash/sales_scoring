"use client"

import { Upload, Play, Download } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { AnalysisResult, AudioFile } from "@/types/projects"

interface QuickActionCardsProps {
  projectId: string
  files: AudioFile[]
  results: AnalysisResult[]
}

export function QuickActionCards({ projectId }: QuickActionCardsProps) {
  const actions = [
    {
      icon: Upload,
      label: "Upload Files",
      onClick: () => console.log("upload", projectId),
      color: "from-blue-500 to-blue-600",
    },
    {
      icon: Play,
      label: "Process All",
      onClick: () => console.log("process", projectId),
      color: "from-emerald-500 to-emerald-600",
    },
    {
      icon: Download,
      label: "Export Results",
      onClick: () => console.log("export", projectId),
      color: "from-purple-500 to-purple-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {actions.map((a) => (
        <Card key={a.label} className="cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-4 flex items-center space-x-4">
            <div className={`p-3 rounded-lg bg-gradient-to-r ${a.color} text-white`}>
              <a.icon className="w-6 h-6" />
            </div>
            <Button variant="ghost" className="text-slate-800" onClick={a.onClick}>
              {a.label}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
