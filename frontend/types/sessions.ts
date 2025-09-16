export interface SessionRecord {
  id: string
  name: string
  description?: string
  createdAt: string
  updatedAt: string
  status: "active" | "archived"
}


