/**
 * Multi-File Call/Chat Scoring Platform - Test Scoring Page
 * 
 * ENHANCED BATCH PROCESSING FEATURES:
 * 
 * 1. Smart Batch Process (⚡):
 *    - Automatically processes files through the complete pipeline: Audio → Transcription → Analysis
 *    - Handles up to 200 files simultaneously with intelligent progress tracking
 *    - Skips already processed steps (won't re-transcribe or re-analyze)
 *    - Shows real-time progress with current file names and completion percentage
 * 
 * 2. Selection Options:
 *    - "Select all on this page": Selects only visible paginated files
 *    - "Select All Files": Selects ALL files across all pages (respects filters)
 *    - "Select Unprocessed": Smart selection of files needing transcription or analysis
 * 
 * 3. Individual Bulk Operations:
 *    - "Transcribe": Batch transcription for selected files
 *    - "Analyze": Batch analysis for selected files (requires checklist)
 *    - "Delete": Bulk removal of selected files
 * 
 * 4. Progress Tracking:
 *    - Real-time progress bar with file-by-file updates
 *    - Stage indicators (🎙️ Transcribing, 🧠 Analyzing, ✅ Complete)
 *    - Current file name display
 *    - Percentage completion
 * 
 * WORKFLOW EXAMPLE:
 * 1. Upload 100+ audio files
 * 2. Upload/create checklist
 * 3. Click "Select Unprocessed" (selects all files needing work)
 * 4. Click "Smart Batch Process" (processes everything automatically)
 * 5. Monitor progress in real-time
 * 6. Export results when complete
 */

"use client"

import { useState, useCallback, useMemo } from "react"
import { FileUploadSection } from "@/components/scoring/file-upload-section"
import { ChecklistSection } from "@/components/scoring/checklist-section"  
import { GeneralAnalytics } from "@/components/scoring/general-analytics"
import { FileStatistics } from "@/components/scoring/file-statistics"
import { TranscriptViewer } from "@/components/scoring/transcript-viewer"
import { BottomControls } from "@/components/scoring/bottom-controls"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, Sparkles, MessageSquare, FileAudio, FileText, Trash2, BarChart3, Users, ChevronLeft, ChevronRight, Search, List, Grid, Loader2, Zap, Check } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Checklist } from "@/types/projects"

const API_BASE_URL = process.env.NEXT_PUBLIC_SCORING_API_URL || "http://localhost:8000/api/v1"
const TRANSCRIBE_ENDPOINT = process.env.NEXT_PUBLIC_TRANSCRIBE_URL || `${API_BASE_URL}/transcribe`
const ANALYSIS_ENDPOINT = process.env.NEXT_PUBLIC_ANALYSIS_URL || `${API_BASE_URL}/analysis/checklist`

// Enhanced interfaces for multiple files
interface UploadedFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  uploadedAt: string
  status: "pending" | "processing" | "completed" | "failed"
  progress?: number
}

interface TranscriptSegment {
  id: string
  speaker: "Operator" | "Client"
  text: string
  timestamp: string
  startTime: number
  endTime: number
}

interface TranscriptData {
  fileId: string
  text: string
  segments: TranscriptSegment[]
  confidence: number
  language: string
  duration: number
  wordCount: number
  processingTime: number
}

interface AnalysisResult {
  fileId: string
  criterionId: string
  categoryId: string
  score: 0 | 1 | "?"
  confidence: number
  explanation: string
  needsReview: boolean
  isEdited: boolean
}

interface BackendTranscriptionSegment {
  id?: number | string
  start?: number
  end?: number
  text?: string
  speaker?: string
  avg_logprob?: number
}

interface BackendTranscriptionResponse {
  text?: string
  language?: string
  duration?: number
  segments?: BackendTranscriptionSegment[]
}

interface BackendAnalysisResult {
  criterion_id: string
  category_id?: string
  score: number | string
  confidence?: number
  explanation?: string
  needs_review?: boolean
}

interface BackendAnalysisResponse {
  results: BackendAnalysisResult[]
}

interface FileSession {
  id: string
  audioFile?: UploadedFile
  transcriptFile?: UploadedFile
  transcriptData?: TranscriptData
  analysisResults: AnalysisResult[]
  isTranscribing: boolean
  isAnalyzing: boolean
}

type PipelineStatus = "complete" | "active" | "up-next" | "blocked"

interface PipelineStep {
  id: string
  title: string
  description: string
  href: string
  done: boolean
  ready: boolean
  blockedMessage?: string
  status: PipelineStatus
}

const formatSeconds = (value: number) => {
  const totalSeconds = Math.max(0, Math.floor(value))
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

export default function TestScoringPage() {
  const { toast } = useToast()
  
  // File management state
  const [fileSessions, setFileSessions] = useState<FileSession[]>([])
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set())
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'transcribed' | 'analyzed'>('all')
  const [sortBy, setSortBy] = useState<'name' | 'date' | 'status' | 'progress'>('date')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 20
  
  // Checklist and processing state  
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [bulkProcessing, setBulkProcessing] = useState(false)
  const [batchProgress, setBatchProgress] = useState<{
    total: number
    current: number
    currentFile: string
    stage: 'transcription' | 'analysis' | 'complete'
  } | null>(null)
  
  // Computed values for large-scale operations
  const filteredSessions = useMemo(() => {
    let filtered = fileSessions

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(session => 
        session.audioFile?.name.toLowerCase().includes(query) ||
        session.transcriptFile?.name.toLowerCase().includes(query)
      )
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(session => {
        switch (filterStatus) {
          case 'pending':
            return !session.transcriptData && !session.isTranscribing
          case 'transcribed':
            return !!session.transcriptData && session.analysisResults.length === 0
          case 'analyzed':
            return session.analysisResults.length > 0
          default:
            return true
        }
      })
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return (a.audioFile?.name || '').localeCompare(b.audioFile?.name || '')
        case 'date':
          return new Date(b.audioFile?.uploadedAt || 0).getTime() - new Date(a.audioFile?.uploadedAt || 0).getTime()
        case 'status':
          const statusA = a.analysisResults.length > 0 ? 3 : a.transcriptData ? 2 : 1
          const statusB = b.analysisResults.length > 0 ? 3 : b.transcriptData ? 2 : 1
          return statusB - statusA
        case 'progress':
          const progressA = a.analysisResults.length > 0 ? 100 : a.transcriptData ? 50 : 0
          const progressB = b.analysisResults.length > 0 ? 100 : b.transcriptData ? 50 : 0
          return progressB - progressA
        default:
          return 0
      }
    })

    return filtered
  }, [fileSessions, searchQuery, filterStatus, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage)
  const paginatedSessions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredSessions.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredSessions, currentPage, itemsPerPage]);

  // Get active session
  const activeSession = fileSessions.find(session => session.id === activeSessionId)
  const activeAnalysisStats = useMemo(() => {
    if (!activeSession || activeSession.analysisResults.length === 0) return null
    const results = activeSession.analysisResults
    const passed = results.filter(result => result.score === 1)
    const failed = results.filter(result => result.score === 0)
    const unclear = results.filter(result => result.score === "?")
    const avgConfidence = Math.round(
      results.reduce((acc, result) => acc + result.confidence, 0) / results.length
    )
    const needsReview = results.filter(result => result.needsReview)
    return {
      passed: passed.length,
      failed: failed.length,
      unclear: unclear.length,
      avgConfidence,
      needsReview: needsReview.length,
      passRate: Math.round((passed.length / results.length) * 100),
    }
  }, [activeSession])
  
  // Check if we can proceed with analysis
  const canAnalyze = checklist && fileSessions.some(session => session.transcriptData)
  const hasAnyResults = fileSessions.some(session => session.analysisResults.length > 0)

  const performanceSummary = useMemo(() => {
    const analyzedSessions = fileSessions.filter(session => session.analysisResults.length > 0)
    const totalCriteria = analyzedSessions.reduce((acc, session) => acc + session.analysisResults.length, 0)

    if (analyzedSessions.length === 0 || totalCriteria === 0) {
      return null
    }

    const passed = analyzedSessions.reduce((acc, session) => acc + session.analysisResults.filter(result => result.score === 1).length, 0)
    const failed = analyzedSessions.reduce((acc, session) => acc + session.analysisResults.filter(result => result.score === 0).length, 0)
    const unclear = analyzedSessions.reduce((acc, session) => acc + session.analysisResults.filter(result => result.score === "?").length, 0)
    const totalConfidence = analyzedSessions.reduce((acc, session) => acc + session.analysisResults.reduce((inner, result) => inner + result.confidence, 0), 0)
    const needsReview = analyzedSessions.reduce((acc, session) => acc + session.analysisResults.filter(result => result.needsReview).length, 0)

    return {
      sessionsAnalyzed: analyzedSessions.length,
      totalCriteria,
      passed,
      failed,
      unclear,
      needsReview,
      passRate: Math.round((passed / totalCriteria) * 100),
      averageConfidence: Math.round(totalConfidence / totalCriteria)
    }
  }, [fileSessions])

  const summaryNarrative = useMemo(() => {
    if (!performanceSummary) return null
    let headline: string
    const recommendations: string[] = []

    if (performanceSummary.passRate >= 85) {
      headline = "Менеджер показывает выдающиеся результаты"
      recommendations.push("Закрепите текущие скрипты и поделитесь лучшими практиками с командой")
    } else if (performanceSummary.passRate >= 65) {
      headline = "Хороший уровень, но есть что улучшить"
      recommendations.push("Проработайте спорные критерии вместе с наставником")
    } else {
      headline = "Нужна фокусная работа над стандартами"
      recommendations.push("Пересмотрите начало разговора и блок работы с возражениями")
    }

    if (performanceSummary.needsReview > 0) {
      recommendations.push("Проведите ручную проверку пунктов, помеченных AI как сомнительные")
    }

    if (performanceSummary.unclear > 0) {
      recommendations.push("Дополните чек-лист примерами ожидаемых формулировок для спорных пунктов")
    }

    return {
      headline,
      recommendations
    }
  }, [performanceSummary])

  // Get global statistics
  const globalStats = {
    totalFiles: fileSessions.length,
    transcribedFiles: fileSessions.filter(session => session.transcriptData).length,
    analyzedFiles: fileSessions.filter(session => session.analysisResults.length > 0).length,
    processingFiles: fileSessions.filter(session => session.isTranscribing || session.isAnalyzing).length
  }

  const pipelineSteps = useMemo<PipelineStep[]>(() => {
    const baseSteps: Omit<PipelineStep, "status">[] = [
      {
        id: "step-upload",
        title: "Шаг 1 · Загрузите записи",
        description: "Добавьте звонки или чаты, чтобы начать оценку.",
        href: "#step-upload",
        done: fileSessions.length > 0,
        ready: true
      },
      {
        id: "step-checklist",
        title: "Шаг 2 · Прикрепите чек-лист",
        description: "Выберите чек-лист, по которому оцениваетесь.",
        href: "#step-checklist",
        done: !!checklist,
        ready: fileSessions.length > 0,
        blockedMessage: fileSessions.length > 0 ? undefined : "Сначала загрузите хотя бы одну запись."
      },
      {
        id: "step-transcribe",
        title: "Шаг 3 · Получите транскрипты",
        description: "Преобразуйте выбранные записи в текст одним кликом.",
        href: "#step-manage",
        done: globalStats.transcribedFiles > 0,
        ready: fileSessions.length > 0,
        blockedMessage: fileSessions.length > 0 ? undefined : "В workspace ещё нет записей."
      },
      {
        id: "step-analyze",
        title: "Шаг 4 · Запустите AI-анализ",
        description: "Сравните диалоги с чек-листом и получите выводы.",
        href: "#step-review",
        done: globalStats.analyzedFiles > 0,
        ready: !!checklist && globalStats.transcribedFiles > 0,
        blockedMessage: checklist
          ? globalStats.transcribedFiles > 0
            ? undefined
            : "Сначала подготовьте хотя бы один транскрипт."
          : "Загрузите чек-лист, чтобы включить AI-оценку."
      },
      {
        id: "executive-insights",
        title: "Шаг 5 · Поделитесь результатами",
        description: "Посмотрите сводку и выгрузите отчёт для руководства.",
        href: "#executive-insights",
        done: hasAnyResults,
        ready: globalStats.analyzedFiles > 0,
        blockedMessage: globalStats.analyzedFiles > 0 ? undefined : "Запустите анализ, чтобы получить сводку."
      }
    ]

    let activeAssigned = false

    return baseSteps.map(step => {
      let status: PipelineStatus
      if (step.done) {
        status = "complete"
      } else if (!activeAssigned && step.ready) {
        status = "active"
        activeAssigned = true
      } else if (step.ready) {
        status = "up-next"
      } else {
        status = "blocked"
      }
      return { ...step, status }
    })
  }, [checklist, fileSessions.length, globalStats.analyzedFiles, globalStats.transcribedFiles, hasAnyResults]);

  const stepStatusStyles: Record<PipelineStatus, { label: string; badgeClass: string; circleClass: string }> = {
    complete: {
      label: "Готово",
      badgeClass: "bg-green-100 text-green-700 border-green-200 dark:bg-green-900/50 dark:text-green-200 dark:border-green-800",
      circleClass: "border-green-500 bg-green-50 text-green-600 dark:border-green-500 dark:bg-green-900/40 dark:text-green-200"
    },
    active: {
      label: "В процессе",
      badgeClass: "bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/50 dark:text-blue-200 dark:border-blue-800",
      circleClass: "border-blue-500 bg-blue-50 text-blue-600 dark:border-blue-500 dark:bg-blue-900/40 dark:text-blue-200"
    },
    "up-next": {
      label: "Далее",
      badgeClass: "bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-200 dark:border-purple-700",
      circleClass: "border-purple-400 bg-white text-purple-600 dark:border-purple-600 dark:bg-purple-950/40 dark:text-purple-200"
    },
    blocked: {
      label: "Ожидание",
      badgeClass: "bg-gray-200 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
      circleClass: "border-gray-300 bg-gray-100 text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
    }
  }

  const transcribeAudioSession = useCallback(async (sessionId: string, audioFile: UploadedFile): Promise<TranscriptData> => {
    const formData = new FormData()
    formData.append("file", audioFile.file, audioFile.name)

    const response = await fetch(TRANSCRIBE_ENDPOINT, {
      method: "POST",
      body: formData
    })

    if (!response.ok) {
      throw new Error(`Transcription failed with status ${response.status}`)
    }

    const data: BackendTranscriptionResponse = await response.json()

    const rawSegments = Array.isArray(data.segments) ? data.segments : []

    if (!rawSegments.length && !(data.text && data.text.trim())) {
      throw new Error("Empty transcription response")
    }

    const normalizedSegments: TranscriptSegment[] = rawSegments.length
      ? rawSegments
          .map((segment, index) => {
            const start = typeof segment.start === "number" ? segment.start : index
            const end = typeof segment.end === "number" ? segment.end : start + 1
            const text = (segment.text ?? "").trim()
            if (!text) {
              return null
            }

            const rawSpeaker = typeof segment.speaker === "string" ? segment.speaker.toLowerCase() : ""
            const speaker: TranscriptSegment["speaker"] = rawSpeaker.includes("client") || rawSpeaker.includes("customer")
              ? "Client"
              : rawSpeaker.includes("agent") || rawSpeaker.includes("operator")
                ? "Operator"
                : index % 2 === 0
                  ? "Operator"
                  : "Client"

            const segmentId = segment.id !== undefined ? String(segment.id) : `${index}`

            return {
              id: `${sessionId}-segment-${segmentId}`,
              speaker,
              text,
              timestamp: formatSeconds(start),
              startTime: start,
              endTime: end
            }
          })
          .filter((segment): segment is TranscriptSegment => Boolean(segment))
      : [
          {
            id: `${sessionId}-segment-0`,
            speaker: "Operator",
            text: (data.text ?? "").trim(),
            timestamp: "00:00",
            startTime: 0,
            endTime: typeof data.duration === "number" ? data.duration : 0
          }
        ]

    const combinedText = (data.text && data.text.trim())
      || normalizedSegments.map(segment => `${segment.speaker === "Operator" ? "Оператор" : "Клиент"}: ${segment.text}`).join("\n")

    const logProbs = rawSegments
      .map(segment => (typeof segment.avg_logprob === "number" ? segment.avg_logprob : null))
      .filter((value): value is number => value !== null)

    const confidence = logProbs.length
      ? Math.min(99, Math.max(50, Math.round((1 + logProbs.reduce((acc, value) => acc + value, 0) / logProbs.length) * 55)))
      : 85

    const duration = typeof data.duration === "number"
      ? data.duration
      : normalizedSegments.length > 0
        ? normalizedSegments[normalizedSegments.length - 1].endTime
        : 0

    const wordCount = combinedText ? combinedText.split(/\s+/).filter(Boolean).length : 0
    const processingTime = Math.max(5, Math.round((normalizedSegments.length || 1) * 1.5))

    return {
      fileId: sessionId,
      text: combinedText,
      segments: normalizedSegments,
      confidence,
      language: data.language || "ru",
      duration,
      wordCount,
      processingTime
    }
  }, [])

  const analyzeAgainstChecklist = useCallback(async (session: FileSession, checklist: Checklist): Promise<AnalysisResult[]> => {
    if (!session.transcriptData) {
      throw new Error("Transcript data is required for analysis")
    }

    const normalizedCategories = checklist.categories.map((category, categoryIndex) => {
      const categoryKey = category.id || `${checklist.id}-category-${categoryIndex}`
      return {
        category,
        key: categoryKey,
        criteria: category.criteria.map((criterion, criterionIndex) => ({
          criterion,
          key: criterion.id || `${categoryKey}-criterion-${criterionIndex}`
        }))
      }
    })

    const checklistPayload = {
      id: checklist.id,
      name: checklist.name,
      description: checklist.description,
      categories: normalizedCategories.map(item => ({
        id: item.key,
        name: item.category.name,
        description: item.category.description,
        criteria: item.criteria.map(crit => ({
          id: crit.key,
          text: crit.criterion.text,
          description: crit.criterion.description,
          type: crit.criterion.type
        }))
      }))
    }

    const payload = {
      transcript_text: session.transcriptData.text,
      checklist: checklistPayload,
      client_name: session.audioFile?.name || "Клиент",
      status: "В работе",
      action_items: [],
      decision: null,
      segments: session.transcriptData.segments.map(segment => ({
        speaker: segment.speaker === "Client" ? "Customer" : "Agent",
        text: segment.text
      }))
    }

    const response = await fetch(ANALYSIS_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    })

    if (!response.ok) {
      throw new Error(`Checklist analysis failed with status ${response.status}`)
    }

    const data: BackendAnalysisResponse = await response.json()
    const resultMap = new Map<string, BackendAnalysisResult>()
    data.results.forEach(item => {
      if (item.criterion_id) {
        resultMap.set(item.criterion_id, item)
      }
    })

    const normalized: AnalysisResult[] = []

    normalizedCategories.forEach(item => {
      const categoryId = item.category.id || item.key
      item.criteria.forEach(({ criterion, key }) => {
        const rawResult = resultMap.get(key)

        const rawScore = rawResult?.score
        let score: 0 | 1 | "?" = "?"
        if (typeof rawScore === "number") {
          if (rawScore >= 0.75) score = 1
          else if (rawScore <= 0.25) score = 0
        } else if (typeof rawScore === "string") {
          const normalizedScore = rawScore.trim().toLowerCase()
          if (["1", "pass", "yes", "true", "выполнено"].includes(normalizedScore)) {
            score = 1
          } else if (["0", "fail", "no", "false", "не выполнено"].includes(normalizedScore)) {
            score = 0
          } else if (["?", "unknown", "uncertain", "неизвестно"].includes(normalizedScore)) {
            score = "?"
          }
        }

        const confidenceSource = rawResult?.confidence
        const confidence = Math.max(0, Math.min(100, Math.round(
          typeof confidenceSource === "number" ? confidenceSource : score === 1 ? 85 : score === 0 ? 70 : 55
        )))

        const explanation = (rawResult?.explanation || "Автоматическая проверка не дала уверенного ответа. Проверьте вручную.").trim()
        const needsReview = typeof rawResult?.needs_review === "boolean"
          ? rawResult!.needs_review
          : score !== 1 || confidence < 70

        normalized.push({
          fileId: session.id,
          criterionId: criterion.id || key,
          categoryId: rawResult?.category_id || categoryId,
          score,
          confidence,
          explanation,
          needsReview,
          isEdited: false
        })
      })
    })

    return normalized
  }, [])

  // Create new file session
  const createFileSession = useCallback((): FileSession => {
    return {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      analysisResults: [],
      isTranscribing: false,
      isAnalyzing: false
    }
  }, []);

  // Helper function to get file name without extension
  const getFileNameWithoutExtension = useCallback((fileName: string) => {
    return fileName.replace(/\.[^/.]+$/, "")
  }, []);

  // Helper function to check if file already exists
  const findExistingSessionByFileName = useCallback((fileName: string) => {
    const nameWithoutExt = getFileNameWithoutExtension(fileName)
    return fileSessions.find(session => {
      if (session.audioFile) {
        const audioNameWithoutExt = getFileNameWithoutExtension(session.audioFile.name)
        return audioNameWithoutExt === nameWithoutExt
      }
      return false
    })
  }, [fileSessions, getFileNameWithoutExtension]);

  // Handle multiple audio file uploads with deduplication
  const handleAudioUpload = useCallback((files: File | File[]) => {
    const filesToProcess = Array.isArray(files) ? files : [files]
    const newSessions: FileSession[] = []
    const duplicateFiles: string[] = []

    filesToProcess.forEach(file => {
      // Check if file already exists
      const existingSession = findExistingSessionByFileName(file.name)
      
      if (existingSession) {
        duplicateFiles.push(file.name)
        return
      }

      // Create new session for new file
      const session = createFileSession()
      const uploadedFile: UploadedFile = {
        id: `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        status: "completed",
        progress: 100
      }
      
      newSessions.push({
        ...session,
        audioFile: uploadedFile
      })
    })

    if (newSessions.length > 0) {
      setFileSessions(prev => [...prev, ...newSessions])
      
      // Set first new session as active
      setActiveSessionId(newSessions[0].id)
      
      toast({
        title: "Audio files uploaded",
        description: `${newSessions.length} new audio file(s) uploaded successfully`
      })
    }

    if (duplicateFiles.length > 0) {
      toast({
        title: "Duplicate files skipped",
        description: `${duplicateFiles.length} file(s) already exist: ${duplicateFiles.join(', ')}`,
        variant: "destructive"
      })
    }
  }, [createFileSession, findExistingSessionByFileName, toast]);

  // Handle transcript generation for specific file
  const handleRunTranscription = useCallback(async (sessionId: string) => {
    const session = fileSessions.find(s => s.id === sessionId)
    if (!session?.audioFile) return
    
    setFileSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, isTranscribing: true } : s
    ))
    
    try {
      const transcript = await transcribeAudioSession(sessionId, session.audioFile)

      setFileSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            transcriptData: transcript,
            isTranscribing: false
          }
        }
        return s
      }))

      toast({
        title: "Transcription complete",
        description: `${session.audioFile.name} has been transcribed successfully`
      })
    } catch (error) {
      setFileSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, isTranscribing: false } : s
      ))
      
      toast({
        title: "Transcription failed", 
        description: "Failed to transcribe audio file",
        variant: "destructive"
      })
    }
  }, [fileSessions, toast, transcribeAudioSession])

  // Handle checklist upload
  const handleChecklistUpload = useCallback((newChecklist: Checklist) => {
    setChecklist(newChecklist)
    toast({
      title: "Checklist loaded",
      description: `${newChecklist.name} is ready for analysis`
    })
  }, [toast]);

  // Handle analysis for specific file
  const handleAnalyzeFile = useCallback(async (sessionId: string) => {
    if (!checklist) return
    
    setFileSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, isAnalyzing: true } : s
    ))
    
    try {
      const session = fileSessions.find(item => item.id === sessionId)
      if (!session) {
        throw new Error("Session not found")
      }

      const results = await analyzeAgainstChecklist(session, checklist)

      setFileSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return {
            ...s,
            analysisResults: results,
            isAnalyzing: false
          }
        }
        return s
      }))

      setHasUnsavedChanges(true)
      toast({
        title: "Analysis complete",
        description: `Analyzed ${results.length} criteria for this file`
      })
    } catch (error) {
      setFileSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, isAnalyzing: false } : s
      ))
      
      toast({
        title: "Analysis failed",
        description: "Failed to analyze transcript",
        variant: "destructive"
      })
    }
  }, [analyzeAgainstChecklist, checklist, fileSessions, toast])

  // Handle batch analysis for all files
  const handleBatchAnalysis = useCallback(async () => {
    if (!checklist) return
    
    const sessionsToAnalyze = fileSessions.filter(session => 
      session.transcriptData && session.analysisResults.length === 0
    )
    
    if (sessionsToAnalyze.length === 0) {
      toast({
        title: "No files to analyze",
        description: "All files with transcripts have already been analyzed"
      })
      return
    }

    // Start analysis for all sessions
    setFileSessions(prev => prev.map(s => 
      sessionsToAnalyze.some(session => session.id === s.id) 
        ? { ...s, isAnalyzing: true } 
        : s
    ))
    
    try {
      // Process all files in parallel
      const analysisPromises = sessionsToAnalyze.map(session => 
        analyzeAgainstChecklist(session, checklist)
      )
      
      const allResults = await Promise.all(analysisPromises)
      
      // Update all sessions with results
      setFileSessions(prev => prev.map(s => {
        const resultIndex = sessionsToAnalyze.findIndex(session => session.id === s.id)
        if (resultIndex !== -1) {
          return {
            ...s,
            analysisResults: allResults[resultIndex],
            isAnalyzing: false
          }
        }
        return s
      }))
      
      setHasUnsavedChanges(true)
      toast({
        title: "Batch analysis complete",
        description: `Analyzed ${sessionsToAnalyze.length} files successfully`
      })
    } catch (error) {
      setFileSessions(prev => prev.map(s => 
        sessionsToAnalyze.some(session => session.id === s.id) 
          ? { ...s, isAnalyzing: false } 
          : s
      ))
      
      toast({
        title: "Batch analysis failed",
        description: "Failed to analyze some files",
        variant: "destructive"
      })
    }
  }, [analyzeAgainstChecklist, checklist, fileSessions, toast])

  // Handle score updates
  const handleScoreUpdate = useCallback((fileId: string, criterionId: string, categoryId: string, score: 0 | 1 | "?", explanation?: string) => {
    setFileSessions(prev => prev.map(session => {
      if (session.id === fileId) {
        return {
          ...session,
          analysisResults: session.analysisResults.map(result => {
            if (result.criterionId === criterionId && result.categoryId === categoryId) {
              return {
                ...result,
                score,
                explanation: explanation || result.explanation,
                isEdited: true,
                needsReview: score === "?"
              }
            }
            return result
          })
        }
      }
      return session
    }))
    setHasUnsavedChanges(true)
  }, []);

  // Remove file session
  const handleRemoveSession = useCallback((sessionId: string) => {
    setFileSessions(prev => prev.filter(session => session.id !== sessionId))
    
    if (activeSessionId === sessionId) {
      const remainingSessions = fileSessions.filter(session => session.id !== sessionId)
      setActiveSessionId(remainingSessions.length > 0 ? remainingSessions[0].id : null)
    }
    
    toast({
      title: "File removed",
      description: "File and associated data have been removed"
    })
  }, [activeSessionId, fileSessions, toast]);

  // Handle save
  const handleSave = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    setHasUnsavedChanges(false)
    toast({
      title: "Scoring saved",
      description: "All changes have been saved successfully"
    })
  }, [toast]);

  // Handle export
  const handleExport = useCallback(async (format: 'json' | 'pdf') => {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    if (format === 'json') {
      const exportData = {
        checklist,
        fileSessions: fileSessions.map(session => ({
          ...session,
          audioFile: session.audioFile ? {
            ...session.audioFile,
            file: undefined // Remove File object for JSON export
          } : undefined,
          transcriptFile: session.transcriptFile ? {
            ...session.transcriptFile,
            file: undefined
          } : undefined
        })),
        exportedAt: new Date().toISOString(),
        summary: globalStats
      }
      
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `multi-file-scoring-report-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
    } else {
      // Mock PDF export
      toast({
        title: "PDF Export",
        description: "PDF export functionality would be implemented here"
      })
    }
    
    toast({
      title: "Export complete",
      description: `Multi-file report exported as ${format.toUpperCase()}`
    })
  }, [checklist, fileSessions, globalStats, toast]);

  // Handle reset
  const handleReset = useCallback(() => {
    setFileSessions([])
    setActiveSessionId(null)
    setChecklist(null)
    setHasUnsavedChanges(false)
    toast({
      title: "Reset complete",
      description: "All data has been cleared"
    })
  }, [toast]);

  // Bulk operations handlers
  const handleSelectCurrentPage = useCallback(() => {
    if (selectedSessions.size === paginatedSessions.length) {
      setSelectedSessions(new Set())
    } else {
      setSelectedSessions(new Set(paginatedSessions.map(s => s.id)))
    }
  }, [selectedSessions.size, paginatedSessions]);

  const handleSelectAllInSession = useCallback(() => {
    if (selectedSessions.size === filteredSessions.length) {
      setSelectedSessions(new Set())
    } else {
      setSelectedSessions(new Set(filteredSessions.map(s => s.id)))
    }
  }, [selectedSessions.size, filteredSessions]);

  const handleSelectUnprocessed = useCallback(() => {
    const unprocessedSessions = filteredSessions.filter(session => 
      !session.transcriptData || session.analysisResults.length === 0
    )
    setSelectedSessions(new Set(unprocessedSessions.map(s => s.id)))
  }, [filteredSessions]);

  const handleSelectSession = useCallback((sessionId: string) => {
    const newSelected = new Set(selectedSessions)
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId)
    } else {
      newSelected.add(sessionId)
    }
    setSelectedSessions(newSelected)
  }, [selectedSessions]);

  const handleBulkTranscription = useCallback(async () => {
    if (selectedSessions.size === 0) return
    
    setBulkProcessing(true)
    
    for (const sessionId of selectedSessions) {
      const session = fileSessions.find(s => s.id === sessionId)
      if (session?.audioFile && !session.transcriptData) {
        await handleRunTranscription(sessionId)
      }
    }
    
    setBulkProcessing(false)
    setSelectedSessions(new Set())
    
    toast({
      title: "Bulk transcription complete",
      description: `Processed ${selectedSessions.size} files`
    })
  }, [selectedSessions, fileSessions, handleRunTranscription, toast]);

  const handleBulkAnalysis = useCallback(async () => {
    if (selectedSessions.size === 0 || !checklist) return
    
    setBulkProcessing(true)
    
    for (const sessionId of selectedSessions) {
      const session = fileSessions.find(s => s.id === sessionId)
      if (session?.transcriptData && session.analysisResults.length === 0) {
        await handleAnalyzeFile(sessionId)
      }
    }
    
    setBulkProcessing(false)
    setSelectedSessions(new Set())
    
    toast({
      title: "Bulk analysis complete", 
      description: `Analyzed ${selectedSessions.size} files`
    })
  }, [selectedSessions, checklist, fileSessions, handleAnalyzeFile, toast]);

  const handleBulkDelete = useCallback(() => {
    if (selectedSessions.size === 0) return
    
    setFileSessions(prev => prev.filter(s => !selectedSessions.has(s.id)))
    setSelectedSessions(new Set())
    
    toast({
      title: "Files deleted",
      description: `Removed ${selectedSessions.size} files`
    })
  }, [selectedSessions, toast]);

  // Comprehensive batch processing (Audio → Transcription → Analysis)
  const handleSmartBatchProcess = useCallback(async () => {
    if (selectedSessions.size === 0 || !checklist) return
    
    setBulkProcessing(true)
    const sessionsToProcess = Array.from(selectedSessions).map(id => 
      fileSessions.find(s => s.id === id)
    ).filter(Boolean) as FileSession[]
    
    const totalFiles = sessionsToProcess.length
    let processedFiles = 0
    
    try {
      for (const session of sessionsToProcess) {
        processedFiles++
        const fileName = session.audioFile?.name || `File ${processedFiles}`
        
        // Step 1: Transcription (if needed)
        if (session.audioFile && !session.transcriptData) {
          setBatchProgress({
            total: totalFiles,
            current: processedFiles,
            currentFile: fileName,
            stage: 'transcription'
          })
          
          await handleRunTranscription(session.id)
          
          // Wait for transcription to complete
          await new Promise(resolve => {
            const checkTranscription = () => {
              const updatedSession = fileSessions.find(s => s.id === session.id)
              if (updatedSession?.transcriptData || !updatedSession?.isTranscribing) {
                resolve(void 0)
              } else {
                setTimeout(checkTranscription, 500)
              }
            }
            checkTranscription()
          })
        }
        
        // Step 2: Analysis (if transcription exists and analysis hasn't been done)
        const currentSession = fileSessions.find(s => s.id === session.id)
        if (currentSession?.transcriptData && currentSession.analysisResults.length === 0) {
          setBatchProgress({
            total: totalFiles,
            current: processedFiles,
            currentFile: fileName,
            stage: 'analysis'
          })
          
          await handleAnalyzeFile(session.id)
          
          // Wait for analysis to complete
          await new Promise(resolve => {
                         const checkAnalysis = () => {
               const updatedSession = fileSessions.find(s => s.id === session.id)
               if (updatedSession?.analysisResults?.length && updatedSession.analysisResults.length > 0 || !updatedSession?.isAnalyzing) {
                 resolve(void 0)
               } else {
                 setTimeout(checkAnalysis, 500)
               }
             }
            checkAnalysis()
          })
        }
      }
      
      setBatchProgress({
        total: totalFiles,
        current: totalFiles,
        currentFile: '',
        stage: 'complete'
      })
      
      setTimeout(() => {
        setBatchProgress(null)
        setBulkProcessing(false)
        setSelectedSessions(new Set())
        
        toast({
          title: "Batch processing complete! 🎉",
          description: `Successfully processed ${totalFiles} files through transcription and analysis`
        })
      }, 1500)
      
    } catch (error) {
      setBatchProgress(null)
      setBulkProcessing(false)
      
      toast({
        title: "Batch processing failed",
        description: "An error occurred during batch processing. Please try again.",
        variant: "destructive"
      })
    }
  }, [selectedSessions, checklist, fileSessions, handleRunTranscription, handleAnalyzeFile, toast]);

    return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="mx-auto w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 py-6">
          <h1 className="text-3xl font-bold">Анализ качества работы менеджера для руководителей</h1>
        </div>

        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <div className="space-y-6">
            <Card className="lg:sticky lg:top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5" />
                  Manager playbook
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pipelineSteps.map((step, index) => (
                    <a
                      key={step.id}
                      href={step.href}
                      className="block rounded-lg border border-transparent p-3 transition-colors hover:border-blue-200 hover:bg-blue-50/60 dark:hover:border-blue-800 dark:hover:bg-blue-950/30"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold ${stepStatusStyles[step.status].circleClass}">
                          {step.status === "complete" ? <Check className="h-4 w-4" /> : index + 1}
                        </div>
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{step.title}</p>
                            <Badge className="border px-2 py-0 text-xs ${stepStatusStyles[step.status].badgeClass}">
                              {stepStatusStyles[step.status].label}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">{step.description}</p>
                          {step.status === "blocked" && step.blockedMessage && (
                            <p className="text-xs text-red-600 dark:text-red-300">{step.blockedMessage}</p>
                          )}
                        </div>
                        <ChevronRight className="mt-1 h-4 w-4 text-gray-400" />
                      </div>
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>

            {batchProgress && (
              <Card className="border-blue-200 bg-blue-50/60 dark:border-blue-800 dark:bg-blue-950/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Smart batch in progress
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                    <span>
                      {batchProgress.stage === 'transcription'
                        ? 'Transcribing conversations'
                        : batchProgress.stage === 'analysis'
                          ? 'Running AI scoring'
                          : 'Finishing touches'}
                    </span>
                    <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                  </div>
                  <Progress value={(batchProgress.current / batchProgress.total) * 100} className="h-2" />
                  {batchProgress.currentFile && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Current file: {batchProgress.currentFile}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-5 w-5" />
                  Tips for directors
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <p>• Step-by-step workflow keeps teams focused—start with uploads, end with exports.</p>
                <p>• Bulk actions live inside <strong>Manage recordings</strong> so operators can process dozens of calls in seconds.</p>
                <p>• Executive insights update automatically once analysis completes.</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card id="step-upload" className="scroll-mt-32">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileAudio className="h-5 w-5" />
                  Step 1 · Upload recordings
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Drag and drop audio files. We automatically group matching filenames so nothing gets lost.
                </p>
              </CardHeader>
              <CardContent>
                <FileUploadSection
                  audioFile={activeSession?.audioFile || null}
                  onAudioUpload={(files) => handleAudioUpload(Array.isArray(files) ? files : [files])}
                  onTranscribe={() => activeSessionId && handleRunTranscription(activeSessionId)}
                  isTranscribing={activeSession?.isTranscribing || false}
                  hasTranscript={!!activeSession?.transcriptData}
                  supportMultiple={true}
                />
              </CardContent>
            </Card>

            <div id="step-checklist" className="scroll-mt-32 space-y-4">
              <Alert className="border-emerald-200 bg-emerald-50/70 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Step 2 · Upload or build the checklist your team scores against. The AI references it line by line.
                </AlertDescription>
              </Alert>
              <ChecklistSection checklist={checklist} onChecklistUpload={handleChecklistUpload} />
            </div>

            {fileSessions.length > 0 ? (
              <Card id="step-manage" className="scroll-mt-32">
                <CardHeader>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Step 3 · Manage & prepare recordings
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Search, filter, and stage files for transcription or analysis. Use the bulk toolbar for multi-file actions.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Search recordings…"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                          <SelectTrigger className="w-36">
                            <SelectValue placeholder="Filter" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All statuses</SelectItem>
                            <SelectItem value="pending">Needs action</SelectItem>
                            <SelectItem value="transcribed">Transcribed</SelectItem>
                            <SelectItem value="analyzed">Analyzed</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                          <SelectTrigger className="w-36">
                            <SelectValue placeholder="Sort" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date">Newest first</SelectItem>
                            <SelectItem value="name">Name A–Z</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                            <SelectItem value="progress">Progress</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>
                        <List className="h-4 w-4" />
                      </Button>
                      <Button variant={viewMode === 'grid' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('grid')}>
                        <Grid className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" size="sm" onClick={handleSelectCurrentPage}>
                      Select page
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSelectAllInSession}>
                      Select all
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSelectUnprocessed}>
                      Select unprocessed
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSessions(new Set())}>
                      Clear
                    </Button>
                    <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                      {selectedSessions.size} selected / {filteredSessions.length} shown
                    </div>
                  </div>

                  {selectedSessions.size > 0 && (
                    <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-blue-900 dark:text-blue-200">
                        <span className="font-medium">{selectedSessions.size} file(s) staged</span>
                        {batchProgress && (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>
                              {batchProgress.stage === 'transcription'
                                ? 'Transcribing'
                                : batchProgress.stage === 'analysis'
                                  ? 'Analyzing'
                                  : 'Completing'}
                              {batchProgress.currentFile ? ` "${batchProgress.currentFile}"` : ''}
                              ({batchProgress.current}/{batchProgress.total})
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          onClick={handleSmartBatchProcess}
                          disabled={bulkProcessing || !checklist}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700"
                        >
                          <Zap className="mr-2 h-4 w-4" />
                          Smart batch process
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleBulkTranscription} disabled={bulkProcessing}>
                          <FileAudio className="mr-2 h-4 w-4" />
                          Transcribe
                        </Button>
                        <Button size="sm" variant="outline" onClick={handleBulkAnalysis} disabled={bulkProcessing || !checklist}>
                          <Sparkles className="mr-2 h-4 w-4" />
                          Analyze
                        </Button>
                        <Button size="sm" variant="destructive" onClick={handleBulkDelete} disabled={bulkProcessing}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    {viewMode === 'list' ? (
                      <div className="space-y-3">
                        {paginatedSessions.map((session) => (
                          <div
                            key={session.id}
                            className="flex flex-col gap-3 rounded-xl border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/60 ${
                              activeSessionId === session.id
                                ? 'border-blue-400 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/30'
                                : 'border-gray-200 dark:border-gray-800'
                            }"
                            onClick={() => setActiveSessionId(session.id)}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-3">
                                <Checkbox
                                  checked={selectedSessions.has(session.id)}
                                  onCheckedChange={() => handleSelectSession(session.id)}
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">
                                    {session.audioFile?.name || session.transcriptFile?.name || 'Untitled recording'}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                                    {session.audioFile && <span>{(session.audioFile.size / (1024 * 1024)).toFixed(1)} MB</span>}
                                    {session.audioFile && <span>•</span>}
                                    <span>
                                      {new Date(
                                        session.audioFile?.uploadedAt || session.transcriptFile?.uploadedAt || ''
                                      ).toLocaleString()}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRunTranscription(session.id)
                                  }}
                                  disabled={session.isTranscribing || !!session.transcriptData}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAnalyzeFile(session.id)
                                  }}
                                  disabled={!session.transcriptData || !checklist || session.isAnalyzing || session.analysisResults.length > 0}
                                >
                                  <Sparkles className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveSession(session.id)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <Badge variant={session.audioFile ? 'default' : 'secondary'}>Audio</Badge>
                                <Badge variant={session.transcriptData ? 'default' : 'secondary'}>Transcript</Badge>
                                <Badge variant={session.analysisResults.length > 0 ? 'default' : 'secondary'}>Analysis</Badge>
                              </div>
                              <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                                {session.isTranscribing && (
                                  <span className="flex items-center gap-2 text-blue-600">
                                    <Loader2 className="h-4 w-4 animate-spin" />Transcribing…
                                  </span>
                                )}
                                {session.isAnalyzing && (
                                  <span className="flex items-center gap-2 text-purple-600">
                                    <Loader2 className="h-4 w-4 animate-spin" />Analyzing…
                                  </span>
                                )}
                                {!session.isTranscribing && !session.isAnalyzing && (
                                  <span>
                                    {session.analysisResults.length > 0
                                      ? 'Analysis ready'
                                      : session.transcriptData
                                        ? 'Ready for analysis'
                                        : 'Awaiting transcription'}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {paginatedSessions.map((session) => (
                          <div
                            key={session.id}
                            className="flex h-full flex-col justify-between rounded-xl border p-4 transition-colors hover:bg-gray-50 dark:hover:bg-gray-900/60 ${
                              activeSessionId === session.id
                                ? 'border-blue-400 bg-blue-50/70 dark:border-blue-500 dark:bg-blue-950/30'
                                : 'border-gray-200 dark:border-gray-800'
                            }"
                            onClick={() => setActiveSessionId(session.id)}
                          >
                            <div className="flex items-start justify-between gap-2">
                              <Checkbox
                                checked={selectedSessions.has(session.id)}
                                onCheckedChange={() => handleSelectSession(session.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                              <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                                {new Date(
                                  session.audioFile?.uploadedAt || session.transcriptFile?.uploadedAt || ''
                                ).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="mt-3 space-y-2">
                              <p className="font-medium text-gray-900 dark:text-gray-100">
                                {session.audioFile?.name || session.transcriptFile?.name || 'Untitled recording'}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <Badge variant={session.audioFile ? 'default' : 'secondary'}>Audio</Badge>
                                <Badge variant={session.transcriptData ? 'default' : 'secondary'}>Transcript</Badge>
                                <Badge variant={session.analysisResults.length > 0 ? 'default' : 'secondary'}>Analysis</Badge>
                              </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
                              <div>
                                {session.isTranscribing
                                  ? 'Transcribing…'
                                  : session.isAnalyzing
                                    ? 'Analyzing…'
                                    : session.analysisResults.length > 0
                                      ? 'Analysis ready'
                                      : session.transcriptData
                                        ? 'Ready to analyze'
                                        : 'Needs transcription'}
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRunTranscription(session.id)
                                  }}
                                  disabled={session.isTranscribing || !!session.transcriptData}
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAnalyzeFile(session.id)
                                  }}
                                  disabled={!session.transcriptData || !checklist || session.isAnalyzing || session.analysisResults.length > 0}
                                >
                                  <Sparkles className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveSession(session.id)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t pt-4">
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Page {currentPage} of {totalPages}
                      </span>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                          disabled={currentPage === totalPages}
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card id="step-manage" className="scroll-mt-32">
                <CardContent className="py-12 text-center text-sm text-gray-500 dark:text-gray-300">
                  Upload recordings above to unlock management tools.
                </CardContent>
              </Card>
            )}

            <Card id="step-review" className="scroll-mt-32">
              <CardHeader>
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Step 4 · Review & coach
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Pick a file to see transcript, AI scoring, and performance stats side-by-side.
                    </p>
                  </div>
                  {activeSession && (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleAnalyzeFile(activeSession.id)}
                        disabled={!activeSession.transcriptData || !checklist || activeSession.isAnalyzing || activeSession.analysisResults.length > 0}
                        className="gap-2"
                      >
                        {activeSession.isAnalyzing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analyzing…
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Run analysis
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => activeSessionId && handleRunTranscription(activeSessionId)}
                        disabled={!activeSessionId || !activeSession?.audioFile || activeSession?.transcriptData || activeSession?.isTranscribing}
                        className="gap-2"
                      >
                        {activeSession?.isTranscribing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Transcribing…
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            Transcribe again
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {activeSession ? (
                  <>
                    <div className="grid gap-4 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            {activeSession.audioFile?.name || activeSession.transcriptFile?.name || 'Unnamed recording'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Uploaded {new Date(activeSession.audioFile?.uploadedAt || activeSession.transcriptFile?.uploadedAt || '').toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={activeSession.audioFile ? 'default' : 'secondary'}>Audio</Badge>
                          <Badge variant={activeSession.transcriptData ? 'default' : 'secondary'}>Transcript</Badge>
                          <Badge variant={activeSession.analysisResults.length > 0 ? 'default' : 'secondary'}>Analysis</Badge>
                        </div>
                      </div>
                      {activeSession.analysisResults.length > 0 && (
                        <div className="grid gap-4 text-sm sm:grid-cols-3">
                          <div className="rounded-lg bg-blue-50 p-3 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                            <p className="text-xs uppercase">Criteria evaluated</p>
                            <p className="text-xl font-semibold">{activeSession.analysisResults.length}</p>
                          </div>
                          <div className="rounded-lg bg-green-50 p-3 text-green-900 dark:bg-green-950/30 dark:text-green-200">
                            <p className="text-xs uppercase">High confidence</p>
                            <p className="text-xl font-semibold">
                              {activeSession.analysisResults.filter(r => r.confidence >= 80).length}
                            </p>
                          </div>
                          <div className="rounded-lg bg-yellow-50 p-3 text-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-200">
                            <p className="text-xs uppercase">Needs review</p>
                            <p className="text-xl font-semibold">
                              {activeSession.analysisResults.filter(r => r.needsReview).length}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {activeSession.isTranscribing ? (
                      <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-blue-200 bg-blue-50/70 p-8 text-blue-900 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-100">
                        <Loader2 className="h-8 w-8 animate-spin" />
                        <p className="text-sm font-medium">Выполняем транскрибацию аудио…</p>
                        <p className="text-xs text-blue-700 dark:text-blue-200/80">Это может занять несколько минут для длинных записей.</p>
                      </div>
                    ) : (
                      activeSession.transcriptData && (
                        <TranscriptViewer transcriptData={activeSession.transcriptData} audioFile={activeSession.audioFile || null} />
                      )
                    )}

                    <FileStatistics
                      session={activeSession}
                      checklist={checklist}
                      onViewTranscript={() => {}}
                      onEditAnalysis={() => {}}
                      onPlayAudio={() => {}}
                      onDownload={() => {}}
                    />

                    {activeSession.analysisResults.length > 0 && checklist && (
                      <div className="space-y-4 rounded-xl border border-blue-200 bg-blue-50/70 p-4 text-sm dark:border-blue-800 dark:bg-blue-950/30">
                        <div className="space-y-1">
                          <p className="text-base font-semibold text-blue-900 dark:text-blue-100">AI-анализ по чек-листу</p>
                          <p className="text-blue-800 dark:text-blue-200">
                            Автоматическая оценка критериев, подготовленная для руководителя.
                          </p>
                        </div>

                        {activeAnalysisStats && (
                          <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-lg bg-white/70 p-3 text-sm shadow-sm dark:bg-blue-950/40">
                              <p className="text-xs uppercase text-blue-500 dark:text-blue-200/80">Выполнено</p>
                              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{activeAnalysisStats.passed}</p>
                            </div>
                            <div className="rounded-lg bg-white/70 p-3 text-sm shadow-sm dark:bg-blue-950/40">
                              <p className="text-xs uppercase text-blue-500 dark:text-blue-200/80">Провалы</p>
                              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{activeAnalysisStats.failed}</p>
                            </div>
                            <div className="rounded-lg bg-white/70 p-3 text-sm shadow-sm dark:bg-blue-950/40">
                              <p className="text-xs uppercase text-blue-500 dark:text-blue-200/80">Неопределённо</p>
                              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{activeAnalysisStats.unclear}</p>
                            </div>
                          </div>
                        )}

                        {activeAnalysisStats && (
                          <div className="flex flex-wrap gap-3 text-xs text-blue-800 dark:text-blue-200">
                            <span>Успешность: {activeAnalysisStats.passRate}%</span>
                            <span>Средняя уверенность: {activeAnalysisStats.avgConfidence}%</span>
                            <span>Нужно ручной проверки: {activeAnalysisStats.needsReview}</span>
                          </div>
                        )}

                        <div className="space-y-2">
                          {activeSession.analysisResults.map(result => {
                            const category = checklist?.categories.find(cat => {
                              const candidateId = cat.id || cat.name
                              return candidateId === result.categoryId || cat.name === result.categoryId
                            })
                            const resolvedCategoryId = category ? (category.id || category.name) : undefined
                            const criterion = category?.criteria.find(crit => {
                              const candidateId = crit.id || `${resolvedCategoryId}-${crit.text}`
                              return candidateId === result.criterionId || crit.text === result.criterionId
                            })
                            const statusLabel = result.score === 1 ? 'Выполнено' : result.score === 0 ? 'Не выполнено' : 'Требует проверки'
                            return (
                              <div key={`${result.categoryId}-${result.criterionId}`} className="rounded-lg border border-blue-200 bg-white p-3 text-sm dark:border-blue-800 dark:bg-gray-900">
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                                  <div>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100">{criterion?.text || 'Критерий из чек-листа'}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{category?.name || 'Категория без названия'}</p>
                                  </div>
                                  <Badge variant={result.score === 1 ? 'default' : result.score === 0 ? 'destructive' : 'secondary'}>
                                    {statusLabel}
                                  </Badge>
                                </div>
                                <p className="mt-2 text-gray-700 dark:text-gray-300">{result.explanation}</p>
                                <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                                  <span>Уверенность: {result.confidence}%</span>
                                  {result.needsReview && (
                                    <span className="text-yellow-600 dark:text-yellow-300">Нужна проверка менеджером</span>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-300">
                    Select a recording from the management list to review transcripts and AI scores.
                  </div>
                )}
              </CardContent>
            </Card>

            {hasAnyResults && (
              <div id="executive-insights" className="scroll-mt-32">
                <GeneralAnalytics sessions={fileSessions} checklist={checklist} />
              </div>
            )}

            {performanceSummary && summaryNarrative && (
              <Card className="scroll-mt-32 border-emerald-200 bg-emerald-50/70 dark:border-emerald-800 dark:bg-emerald-950/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Итоговая оценка работы менеджера
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="grid gap-3 sm:grid-cols-5">
                    <div className="rounded-lg bg-white p-3 text-center shadow-sm dark:bg-gray-900">
                      <p className="text-xs text-gray-500">Проверено звонков</p>
                      <p className="text-xl font-semibold text-emerald-600">{performanceSummary.sessionsAnalyzed}</p>
                    </div>
                    <div className="rounded-lg bg-white p-3 text-center shadow-sm dark:bg-gray-900">
                      <p className="text-xs text-gray-500">Критериев пройдено</p>
                      <p className="text-xl font-semibold text-emerald-600">{performanceSummary.passed}</p>
                    </div>
                    <div className="rounded-lg bg-white p-3 text-center shadow-sm dark:bg-gray-900">
                      <p className="text-xs text-gray-500">Провалов</p>
                      <p className="text-xl font-semibold text-red-500">{performanceSummary.failed}</p>
                    </div>
                    <div className="rounded-lg bg-white p-3 text-center shadow-sm dark:bg-gray-900">
                      <p className="text-xs text-gray-500">Успешность</p>
                      <p className="text-xl font-semibold text-emerald-600">{performanceSummary.passRate}%</p>
                    </div>
                    <div className="rounded-lg bg-white p-3 text-center shadow-sm dark:bg-gray-900">
                      <p className="text-xs text-gray-500">Средняя уверенность</p>
                      <p className="text-xl font-semibold text-emerald-600">{performanceSummary.averageConfidence}%</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-base font-semibold text-emerald-900 dark:text-emerald-100">{summaryNarrative.headline}</p>
                    <p className="mt-1 text-gray-700 dark:text-gray-300">
                      По итогам автоматической проверки менеджер выполняет {performanceSummary.passRate}% требований чек-листа.
                    </p>
                  </div>

                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">Следующие шаги</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-gray-700 dark:text-gray-300">
                      {summaryNarrative.recommendations.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  {performanceSummary.needsReview > 0 && (
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      Обратите внимание: {performanceSummary.needsReview} пункт(ов) требуют ручного подтверждения качества.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {fileSessions.length > 0 && (!checklist || !fileSessions.some(s => s.transcriptData)) && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {!checklist && !fileSessions.some(s => s.transcriptData)
                    ? "Upload a checklist and generate at least one transcript to unlock analysis."
                    : !checklist
                      ? "Upload or create a checklist to run AI scoring."
                      : "Generate a transcript for at least one recording to proceed."}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>


        <BottomControls
          hasResults={hasAnyResults}
          hasUnsavedChanges={hasUnsavedChanges}
          onSave={handleSave}
          onExport={handleExport}
          onReset={handleReset}
        />
      </div>
    </div>
  )
}
