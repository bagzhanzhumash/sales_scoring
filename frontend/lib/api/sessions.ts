import { SessionRecord } from "@/types/sessions"

const base = "/app/api/v1/sessions".replace("/app", "")

export async function listSessions(): Promise<SessionRecord[]> {
  const res = await fetch(`${base}`)
  if (!res.ok) throw new Error("Failed to list sessions")
  const data = await res.json()
  return data.sessions as SessionRecord[]
}

export async function getSession(id: string): Promise<SessionRecord> {
  const res = await fetch(`${base}/${id}`)
  if (!res.ok) throw new Error("Failed to get session")
  return (await res.json()) as SessionRecord
}

export async function createSession(input: { name: string; description?: string }): Promise<SessionRecord> {
  const res = await fetch(`${base}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to create session")
  return (await res.json()) as SessionRecord
}

export async function updateSession(id: string, input: Partial<Pick<SessionRecord, "name" | "description" | "status">>): Promise<SessionRecord> {
  const res = await fetch(`${base}/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error("Failed to update session")
  return (await res.json()) as SessionRecord
}

export async function deleteSession(id: string): Promise<void> {
  const res = await fetch(`${base}/${id}`, { method: "DELETE" })
  if (!res.ok) throw new Error("Failed to delete session")
}


