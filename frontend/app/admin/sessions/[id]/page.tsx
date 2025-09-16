"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { getSession, updateSession, deleteSession } from "@/lib/api/sessions"
import type { SessionRecord } from "@/types/sessions"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from "next/link"

export default function SessionDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const [session, setSession] = useState<SessionRecord | null>(null)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  useEffect(() => {
    if (!params?.id) return
    getSession(params.id).then(s => {
      setSession(s)
      setName(s.name)
      setDescription(s.description ?? "")
    }).catch(() => {})
  }, [params?.id])

  async function handleSave() {
    if (!session) return
    const updated = await updateSession(session.id, { name, description })
    setSession(updated)
  }

  async function handleDelete() {
    if (!session) return
    await deleteSession(session.id)
    router.push("/admin/sessions")
  }

  if (!session) return <div className="p-6">Loading...</div>

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Session: {session.id}</h1>
        <Link className="underline text-sm" href={`/test-scoring?sessionId=${session.id}`}>Open in Test Scoring</Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input value={name} onChange={e => setName(e.target.value)} />
          <Textarea value={description} onChange={e => setDescription(e.target.value)} />
          <div className="flex gap-2">
            <Button onClick={handleSave}>Save</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
            <Link className="underline text-sm ml-auto" href="/admin/sessions">Back</Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


