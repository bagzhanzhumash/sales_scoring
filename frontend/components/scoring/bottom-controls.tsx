"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Save,
  Download,
  RotateCcw,
  FileText,
  FileJson,
  AlertTriangle,
  CheckCircle,
  Loader2
} from "lucide-react"

interface BottomControlsProps {
  hasResults: boolean
  hasUnsavedChanges: boolean
  onSave: () => Promise<void>
  onExport: (format: 'json' | 'pdf') => Promise<void>
  onReset: () => void
}

export function BottomControls({
  hasResults,
  hasUnsavedChanges,
  onSave,
  onExport,
  onReset
}: BottomControlsProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [exportFormat, setExportFormat] = useState<'json' | 'pdf'>('json')
  const [showResetConfirm, setShowResetConfirm] = useState(false)

  const handleSave = async () => {
    setIsSaving(true)
    try {
      await onSave()
    } finally {
      setIsSaving(false)
    }
  }

  const handleExport = async () => {
    setIsExporting(true)
    try {
      await onExport(exportFormat)
    } finally {
      setIsExporting(false)
    }
  }

  const handleReset = () => {
    onReset()
    setShowResetConfirm(false)
  }

  return (
    <Card className="sticky bottom-4 shadow-lg border-2">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Status Indicator */}
          <div className="flex items-center gap-3">
            {hasUnsavedChanges ? (
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-700 dark:text-yellow-300">
                  Unsaved changes
                </span>
                <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                  Modified
                </Badge>
              </div>
            ) : hasResults ? (
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-700 dark:text-green-300">
                  All changes saved
                </span>
                <Badge variant="outline" className="text-green-600 border-green-300">
                  Saved
                </Badge>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-gray-300 dark:bg-gray-600" />
                <span className="text-sm text-gray-500">
                  No analysis results yet
                </span>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Reset Button */}
            <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  disabled={!hasResults}
                  className="text-red-600 border-red-300 hover:bg-red-50 dark:hover:bg-red-950"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reset Evaluation</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      This will permanently delete all uploaded files, analysis results, and scoring data. 
                      This action cannot be undone.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex justify-end gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => setShowResetConfirm(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleReset}
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Reset Everything
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Export Button */}
            <Dialog>
              <DialogTrigger asChild>
                <Button 
                  variant="outline" 
                  disabled={!hasResults || isExporting}
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Export Report
                    </>
                  )}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Scoring Report</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Export Format
                    </label>
                    <Select value={exportFormat} onValueChange={(value: 'json' | 'pdf') => setExportFormat(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="json">
                          <div className="flex items-center gap-2">
                            <FileJson className="h-4 w-4" />
                            <div>
                              <div className="font-medium">JSON Data</div>
                              <div className="text-xs text-gray-500">
                                Complete data export for analysis
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                        <SelectItem value="pdf">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <div>
                              <div className="font-medium">PDF Report</div>
                              <div className="text-xs text-gray-500">
                                Formatted report for sharing
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <h4 className="font-medium text-sm mb-2">Export includes:</h4>
                    <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                      <li>• Analysis results and scores</li>
                      <li>• AI explanations and confidence levels</li>
                      <li>• Manual edits and overrides</li>
                      <li>• Transcript data and timestamps</li>
                      <li>• Statistical summaries</li>
                    </ul>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button variant="outline">
                      Cancel
                    </Button>
                    <Button onClick={handleExport} disabled={isExporting}>
                      {isExporting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4 mr-2" />
                          Export {exportFormat.toUpperCase()}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Save Button */}
            <Button 
              onClick={handleSave}
              disabled={!hasResults || isSaving || !hasUnsavedChanges}
              className="min-w-[120px]"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Scoring
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Help Text */}
        {!hasResults && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-gray-500 text-center">
              Complete the analysis to enable save and export functions
            </p>
          </div>
        )}
        
        {hasResults && hasUnsavedChanges && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-yellow-600 dark:text-yellow-400 text-center">
              💡 Don't forget to save your changes before exporting or leaving the page
            </p>
          </div>
        )}
        
        {hasResults && !hasUnsavedChanges && (
          <div className="mt-3 pt-3 border-t">
            <p className="text-xs text-green-600 dark:text-green-400 text-center">
              ✓ All scoring data is saved and ready for export
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 