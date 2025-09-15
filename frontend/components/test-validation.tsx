"use client"

import { FileUploadSection } from "@/components/scoring/file-upload-section"
import { ChecklistSection } from "@/components/scoring/checklist-section"  
import { AutoAnalysisSection } from "@/components/scoring/auto-analysis-section"
import { StatisticsSection } from "@/components/scoring/statistics-section"
import { TranscriptViewer } from "@/components/scoring/transcript-viewer"
import { BottomControls } from "@/components/scoring/bottom-controls"

// Simple validation component to test imports
export function TestValidation() {
  return (
    <div className="p-4">
      <h2 className="text-lg font-bold mb-4">All Scoring Components Imported Successfully!</h2>
      <div className="space-y-2 text-sm">
        <div>✓ FileUploadSection</div>
        <div>✓ ChecklistSection</div>
        <div>✓ AutoAnalysisSection</div>
        <div>✓ StatisticsSection</div>
        <div>✓ TranscriptViewer</div>
        <div>✓ BottomControls</div>
      </div>
    </div>
  )
} 