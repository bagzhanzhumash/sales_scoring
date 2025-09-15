import { NextResponse } from "next/server"
import type { SystemStatus } from "@/types/dashboard"

export async function GET() {
  const mock: SystemStatus = {
    status: "healthy",
    services: [
      { name: "API", status: "online", response_time_ms: 42, last_check: new Date().toISOString() },
      { name: "Database", status: "online", response_time_ms: 19, last_check: new Date().toISOString() },
      { name: "WebSocket", status: "online", response_time_ms: 8, last_check: new Date().toISOString() },
      { name: "Worker", status: "online", response_time_ms: 33, last_check: new Date().toISOString() },
    ],
    active_tasks: 3,
    queue_length: 7,
  }

  return NextResponse.json(mock)
}
