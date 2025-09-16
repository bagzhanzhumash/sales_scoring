"use client"

import { useEffect, useMemo, useState } from "react"
import { listSessions, deleteSession } from "@/lib/api/sessions"
import type { SessionRecord } from "@/types/sessions"
import { AppSidebar } from "@/components/app-sidebar"
import { SimpleHeader } from "@/components/site-header"
import { SimpleCards } from "@/components/section-cards"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { SidebarProvider } from "@/components/ui/sidebar"
import Link from "next/link"

export default function AdminDashboardPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([])

  useEffect(() => {
    listSessions().then(setSessions).catch(() => {})
  }, [])

  const stats = useMemo(() => {
    const total = sessions.length
    const active = sessions.filter(s => s.status === "active").length
    const archived = total - active
    return { total, active, archived }
  }, [sessions])

  async function remove(id: string) {
    await deleteSession(id)
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <SimpleHeader title="Admin Dashboard" />
          <div className="p-6 space-y-6">
            <SimpleCards cards={[
              { label: "Sessions", value: stats.total },
              { label: "Active", value: stats.active },
              { label: "Archived", value: stats.archived },
            ]} />

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">Recent Sessions</h2>
                  <Link className="underline text-sm" href="/admin/sessions">Manage all</Link>
                </div>
                <div className="divide-y">
                  {sessions.slice(0, 10).map(s => (
                    <div key={s.id} className="flex items-center justify-between py-2">
                      <div>
                        <div className="font-medium">{s.name}</div>
                        <div className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Link className="underline text-sm" href={`/test-scoring?sessionId=${s.id}`}>Open in Test</Link>
                        <Link className="underline text-sm" href={`/admin/sessions/${s.id}`}>Edit</Link>
                        <Button variant="destructive" size="sm" onClick={() => remove(s.id)}>Delete</Button>
                      </div>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <div className="text-sm text-muted-foreground py-6">No sessions yet</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </SidebarProvider>
  )
}


