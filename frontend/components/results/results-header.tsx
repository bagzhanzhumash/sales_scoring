"use client"

import { Download, Grid, Table } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Project } from "@/types/projects"

interface ResultsHeaderProps {
  project?: Project
  totalResults: number
  onExport: () => void
  viewMode: "table" | "grid"
  onViewModeChange: (mode: "table" | "grid") => void
}

export function ResultsHeader({ project, totalResults, onExport, viewMode, onViewModeChange }: ResultsHeaderProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
      <div>
        <div className="flex items-center space-x-3 mb-2">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">📊</div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Analysis Results</h1>
        </div>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          {project ? (
            <>
              Project: <span className="font-medium">{project.name}</span> | {totalResults} results
            </>
          ) : (
            <>{totalResults} results across all projects</>
          )}
        </p>
      </div>

      <div className="flex items-center space-x-3">
        {/* View Mode Toggle */}
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => onViewModeChange("table")}
            className={`p-2 rounded-md transition-all ${
              viewMode === "table"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Table className="w-4 h-4" />
          </button>
          <button
            onClick={() => onViewModeChange("grid")}
            className={`p-2 rounded-md transition-all ${
              viewMode === "grid"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>

        <Button onClick={onExport} className="bg-emerald-600 hover:bg-emerald-700">
          <Download className="w-4 h-4 mr-2" />
          Export All
        </Button>
      </div>
    </div>
  )
}
