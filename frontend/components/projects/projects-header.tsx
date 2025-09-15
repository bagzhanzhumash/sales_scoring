"use client"

import { ChevronRight, Home } from "lucide-react"
import { useRouter } from "next/navigation"

export function ProjectsHeader() {
  const router = useRouter()

  return (
    <nav className="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
      <button
        onClick={() => router.push("/")}
        className="flex items-center hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
      >
        <Home className="w-4 h-4 mr-1" />
        Dashboard
      </button>
      <ChevronRight className="w-4 h-4" />
      <span className="text-slate-900 dark:text-slate-200 font-medium">Projects</span>
    </nav>
  )
}
