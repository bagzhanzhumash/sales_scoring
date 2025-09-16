import { NextResponse } from "next/server"
import { promises as fs } from "fs"
import path from "path"

interface SessionRecord {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  status: "active" | "archived"
}

const DATA_DIR = path.join(process.cwd(), "data", "sessions")
const DATA_FILE = path.join(DATA_DIR, "sessions.json")

async function ensureStorage(): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true })
  try {
    await fs.access(DATA_FILE)
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ sessions: [] }, null, 2), "utf8")
  }
}

async function readSessions(): Promise<SessionRecord[]> {
  await ensureStorage()
  const raw = await fs.readFile(DATA_FILE, "utf8")
  const parsed = JSON.parse(raw) as { sessions: SessionRecord[] }
  return parsed.sessions ?? []
}

async function writeSessions(sessions: SessionRecord[]): Promise<void> {
  await ensureStorage()
  await fs.writeFile(DATA_FILE, JSON.stringify({ sessions }, null, 2), "utf8")
}

export async function GET(
  _request: Request,
  context: { params: { id: string } }
) {
  try {
    const sessions = await readSessions()
    const session = sessions.find(s => s.id === context.params.id)
    if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json(session)
  } catch (error) {
    return NextResponse.json({ error: "Failed to read session" }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  context: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const sessions = await readSessions()
    const idx = sessions.findIndex(s => s.id === context.params.id)
    if (idx === -1) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const now = new Date().toISOString()
    sessions[idx] = {
      ...sessions[idx],
      ...("name" in body ? { name: String(body.name) } : {}),
      ...("description" in body ? { description: body.description ? String(body.description) : undefined } : {}),
      ...("status" in body ? { status: body.status === "archived" ? "archived" : "active" } : {}),
      updatedAt: now,
    }
    await writeSessions(sessions)
    return NextResponse.json(sessions[idx])
  } catch (error) {
    return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  context: { params: { id: string } }
) {
  try {
    const sessions = await readSessions()
    const next = sessions.filter(s => s.id !== context.params.id)
    if (next.length === sessions.length) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }
    await writeSessions(next)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete session" }, { status: 500 })
  }
}


