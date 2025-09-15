"use client"

import { useState, useEffect, useRef } from "react"

export interface ProjectUpdate {
  type: "file_uploaded" | "processing_started" | "analysis_completed" | "export_ready" | "project_updated"
  timestamp: string
  data: any
  message: string
}

export function useProjectWebSocket(projectId: string) {
  const [updates, setUpdates] = useState<ProjectUpdate[]>([])
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // Mock WebSocket connection for development
    const mockUpdates = () => {
      const updateTypes: ProjectUpdate["type"][] = [
        "file_uploaded",
        "processing_started",
        "analysis_completed",
        "export_ready",
      ]

      const randomUpdate: ProjectUpdate = {
        type: updateTypes[Math.floor(Math.random() * updateTypes.length)],
        timestamp: new Date().toISOString(),
        data: { fileId: `file-${Date.now()}` },
        message: "Mock update for development",
      }

      setUpdates((prev) => [randomUpdate, ...prev.slice(0, 9)])
    }

    // Simulate periodic updates in development
    const interval = setInterval(mockUpdates, 30000) // Every 30 seconds

    return () => {
      clearInterval(interval)
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [projectId])

  return updates
}
