"use client"

import { Calendar, User } from "lucide-react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { Project } from "@/types/projects"

interface ProjectMetaInfoProps {
  project: Project
}

export function ProjectMetaInfo({ project }: ProjectMetaInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Info</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center space-x-2 text-sm">
          <Calendar className="w-4 h-4 text-slate-500" />
          <span>
            Created&nbsp;
            {new Date(project.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <User className="w-4 h-4 text-slate-500" />
          <span>By {project.creator_name || "Unknown"}</span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {project.description || "No description provided."}
        </p>
      </CardContent>
    </Card>
  )
}
