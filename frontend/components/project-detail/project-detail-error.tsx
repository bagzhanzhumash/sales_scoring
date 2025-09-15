"use client"

import { AlertCircle, RefreshCw, ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

interface ProjectDetailErrorProps {
  onRetry: () => void
}

export function ProjectDetailError({ onRetry }: ProjectDetailErrorProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
      <div className="text-center py-12 px-6">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">Unable to load project</h3>
        <p className="text-slate-600 dark:text-slate-400 mb-8 max-w-md">
          We're having trouble loading this project. Please check your connection and try again.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={onRetry} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
          <Button variant="outline" onClick={() => router.push("/projects")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    </div>
  )
}
