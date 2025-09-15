"use client"

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { AudioFile } from "@/types/projects"

interface ProcessingStatusChartProps {
  files: AudioFile[]
}

export function ProcessingStatusChart({ files }: ProcessingStatusChartProps) {
  if (!files) return null

  const data = [
    { name: "Completed", value: files.filter((f) => f.status === "completed").length, color: "#10b981" },
    { name: "Processing", value: files.filter((f) => f.status === "processing").length, color: "#3b82f6" },
    { name: "Pending", value: files.filter((f) => f.status === "pending").length, color: "#f59e0b" },
    { name: "Failed", value: files.filter((f) => f.status === "failed").length, color: "#ef4444" },
  ].filter((d) => d.value > 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>File Status</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        {data.length === 0 ? (
          <p className="text-center text-sm text-slate-500 pt-16">No files yet</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} dataKey="value" innerRadius="60%" outerRadius="80%" paddingAngle={4}>
                {data.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  )
}
