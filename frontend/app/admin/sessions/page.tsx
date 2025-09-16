"use client"

import { useEffect, useState } from "react"
import { createSession, deleteSession, listSessions, updateSession } from "@/lib/api/sessions"
import type { SessionRecord } from "@/types/sessions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default function SessionsAdminPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    listSessions().then(setSessions).catch(() => {})
  }, [])

  async function handleCreate() {
    if (!name.trim()) return
    setLoading(true)
    try {
      const s = await createSession({ name: name.trim(), description: description.trim() || undefined })
      setSessions(prev => [s, ...prev])
      setName("")
      setDescription("")
    } finally {
      setLoading(false)
    }
  }

  async function handleArchive(id: string) {
    const updated = await updateSession(id, { status: "archived" })
    setSessions(prev => prev.map(s => (s.id === id ? updated : s)))
  }

  async function handleDelete(id: string) {
    await deleteSession(id)
    setSessions(prev => prev.filter(s => s.id !== id))
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Admin • Scoring Sessions</h1>
        <p className="text-muted-foreground text-sm">Create sessions and open them in Test Scoring</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Create session</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Name" value={name} onChange={e => setName(e.target.value)} />
          <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
          <Button onClick={handleCreate} disabled={loading || !name.trim()}>Create</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sessions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sessions.length === 0 && <div className="text-sm text-muted-foreground">No sessions yet</div>}
          <div className="space-y-3">
            {sessions.map(s => (
              <div key={s.id} className="flex items-center justify-between border rounded-md p-3">
                <div>
                  <div className="font-medium">{s.name}</div>
                  {s.description && <div className="text-sm text-muted-foreground">{s.description}</div>}
                  <div className="text-xs text-muted-foreground">{new Date(s.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
                  <Link href={`/admin/sessions/${s.id}`} className="text-sm underline">Manage</Link>
                  <Link href={`/test-scoring?sessionId=${s.id}`} className="text-sm underline">Open in Test</Link>
                  <Button variant="outline" size="sm" onClick={() => handleArchive(s.id)} disabled={s.status === "archived"}>Archive</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDelete(s.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


