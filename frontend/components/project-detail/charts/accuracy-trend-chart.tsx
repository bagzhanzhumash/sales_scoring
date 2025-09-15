"use client"

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import type { ProjectAnalytics } from "@/types/projects"

interface AccuracyTrendChartProps {
  analytics: ProjectAnalytics
}

export function AccuracyTrendChart({ analytics }: AccuracyTrendChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Accuracy Trend (30 days)</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={analytics.accuracy_trend}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(v) => new Date(v).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              fontSize={12}
            />
            <YAxis domain={[60, 100]} fontSize={12} />
            <Tooltip
              labelFormatter={(label) =>
                `Date: ${new Date(label).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              }
              formatter={(val: number) => [`${val}%`, "Accuracy"]}
            />
            <Line type="monotone" dataKey="accuracy" stroke="#8b5cf6" strokeWidth={3} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
