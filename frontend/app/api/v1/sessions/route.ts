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

export async function GET() {
  try {
    const sessions = await readSessions()
    return NextResponse.json({ sessions })
  } catch (error) {
    return NextResponse.json({ error: "Failed to read sessions" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, description } = body as { name?: string; description?: string }
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "name is required" }, { status: 400 })
    }

    const now = new Date().toISOString()
    const newSession: SessionRecord = {
      id: `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name,
      description,
      createdAt: now,
      updatedAt: now,
      status: "active",
    }

    const sessions = await readSessions()
    sessions.unshift(newSession)
    await writeSessions(sessions)
    return NextResponse.json(newSession, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
  }
}


