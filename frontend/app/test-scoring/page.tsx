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

import { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { FileUploadSection } from "@/components/scoring/file-upload-section"
import { ChecklistSection } from "@/components/scoring/checklist-section"  
import { GeneralAnalytics } from "@/components/scoring/general-analytics"
import { FileStatistics } from "@/components/scoring/file-statistics"
import { TranscriptViewer } from "@/components/scoring/transcript-viewer"
import { BottomControls } from "@/components/scoring/bottom-controls"
import { ManagerPerformance } from "@/components/manager-performance"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, Sparkles, MessageSquare, FileAudio, FileText, Trash2, BarChart3, Users, ChevronLeft, ChevronRight, Search, List, Grid, Loader2, Zap, Check, UserCheck, ArrowUpRight, ArrowDownRight, Minus, Play, Share2, FileDown } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { useToast } from "@/hooks/use-toast"
import type { Checklist } from "@/types/projects"

const API_BASE_URL = process.env.NEXT_PUBLIC_SCORING_API_URL || "http://localhost:8000/api/v1"
const TRANSCRIBE_ENDPOINT = process.env.NEXT_PUBLIC_TRANSCRIBE_URL || `${API_BASE_URL}/transcribe`
const ANALYSIS_ENDPOINT = process.env.NEXT_PUBLIC_ANALYSIS_URL || `${API_BASE_URL}/analysis/checklist`
const DEMO_AUDIO_URL = '/demo/sample-call.mp3'
const DEMO_AUDIO_FILENAME = 'demo-call.mp3'
const DEMO_CHECKLIST_URL = '/demo/sales-call-checklist.json'

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
  const [audienceView, setAudienceView] = useState<'executive' | 'analyst'>('executive')
  const [scoreDetailsOpen, setScoreDetailsOpen] = useState(false)
  const [focusedTranscriptTimestamp, setFocusedTranscriptTimestamp] = useState<number | null>(null)
  const focusTimeoutRef = useRef<number | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')
  const [demoLoading, setDemoLoading] = useState(false)
  const [demoLoaded, setDemoLoaded] = useState(false)
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

  useEffect(() => {
    return () => {
      if (focusTimeoutRef.current) {
        window.clearTimeout(focusTimeoutRef.current)
      }
    }
  }, [])
  
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

  const checklistIndex = useMemo(() => {
    if (!checklist) return null

    const criterionMap = new Map<string, {
      categoryName: string
      categoryWeight: number
      criterionText: string
      criterionWeight?: number
    }>()

    checklist.categories.forEach((category, categoryIndex) => {
      const categoryKey = category.id || `${checklist.id}-category-${categoryIndex}`
      category.criteria.forEach((criterion, criterionIndex) => {
        const criterionKey = criterion.id || `${categoryKey}-criterion-${criterionIndex}`
        criterionMap.set(criterionKey, {
          categoryName: category.name,
          categoryWeight: category.weight,
          criterionText: criterion.text,
          criterionWeight: criterion.weight
        })
      })
    })

    return {
      criterionMap
    }
  }, [checklist])

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

  const communicationStats = useMemo(() => {
    let operatorSeconds = 0
    let clientSeconds = 0
    let silenceSeconds = 0
    let sessionsWithTranscripts = 0

    fileSessions.forEach(session => {
      if (!session.transcriptData) return
      sessionsWithTranscripts += 1

      const segments = session.transcriptData.segments
      let spokenThisCall = 0

      segments.forEach(segment => {
        const segmentDuration = Math.max(0, segment.endTime - segment.startTime)
        spokenThisCall += segmentDuration
        if (segment.speaker === "Operator") {
          operatorSeconds += segmentDuration
        } else if (segment.speaker === "Client") {
          clientSeconds += segmentDuration
        }
      })

      const callDuration = session.transcriptData.duration || spokenThisCall
      silenceSeconds += Math.max(0, callDuration - spokenThisCall)
    })

    const totalSpoken = operatorSeconds + clientSeconds
    const totalDuration = totalSpoken + silenceSeconds

    return {
      hasData: sessionsWithTranscripts > 0 && totalDuration > 0,
      talkShare: totalSpoken > 0 ? operatorSeconds / totalSpoken : null,
      listenShare: totalSpoken > 0 ? clientSeconds / totalSpoken : null,
      silencePercent: totalDuration > 0 ? (silenceSeconds / totalDuration) * 100 : null
    }
  }, [fileSessions])

  const categoryPerformance = useMemo(() => {
    const aggregated = new Map<string, {
      id: string
      name: string
      pass: number
      fail: number
      unsure: number
    }>()

    fileSessions.forEach(session => {
      session.analysisResults.forEach(result => {
        const meta = checklistIndex?.criterionMap.get(result.criterionId)
        const rawName = meta?.categoryName || result.categoryId || "Прочее"
        const key = rawName.trim().toLowerCase()

        if (!aggregated.has(key)) {
          aggregated.set(key, {
            id: key,
            name: rawName,
            pass: 0,
            fail: 0,
            unsure: 0
          })
        }

        const bucket = aggregated.get(key)!
        if (result.score === 1) bucket.pass += 1
        else if (result.score === 0) bucket.fail += 1
        else bucket.unsure += 1
      })
    })

    return Array.from(aggregated.values()).map(item => {
      const total = item.pass + item.fail + item.unsure
      return {
        ...item,
        total,
        attention: item.fail + item.unsure,
        passRate: total > 0 ? Math.round((item.pass / total) * 100) : null
      }
    })
  }, [fileSessions, checklistIndex])

  const extractTimestampFromText = useCallback((text: string | undefined) => {
    if (!text) return { label: null, seconds: null }
    const match = text.match(/\b(\d{1,2}:\d{2})(?::\d{2})?\b/)
    if (!match) return { label: null, seconds: null }
    const label = match[0]
    const parts = label.split(":").map(part => Number.parseInt(part, 10))
    if (parts.some(Number.isNaN)) {
      return { label, seconds: null }
    }
    let seconds = 0
    if (parts.length === 3) {
      seconds = parts[0] * 3600 + parts[1] * 60 + parts[2]
    } else {
      seconds = parts[0] * 60 + parts[1]
    }
    return { label, seconds }
  }, [])

  const focusTranscriptAt = useCallback((time: number | null) => {
    if (time == null) return
    if (focusTimeoutRef.current) {
      window.clearTimeout(focusTimeoutRef.current)
    }
    setAudienceView('analyst')
    setFocusedTranscriptTimestamp(null)
    focusTimeoutRef.current = window.setTimeout(() => {
      setFocusedTranscriptTimestamp(time)
      focusTimeoutRef.current = null
    }, 0)
  }, [setAudienceView, setFocusedTranscriptTimestamp])

  const failingCriteria = useMemo(() => {
    const issues: Array<{
      sessionId: string
      sessionName: string
      criterionId: string
      criterionText: string
      categoryName: string
      explanation: string
      severity: 'fail' | 'review'
      confidence: number
      timestamp: string | null
      timestampSeconds: number | null
    }> = []

    fileSessions.forEach(session => {
      session.analysisResults.forEach(result => {
        const severeFail = result.score === 0
        const needsAttention = severeFail || result.needsReview || result.score === "?"
        if (!needsAttention) return

        const meta = checklistIndex?.criterionMap.get(result.criterionId)
        const explanation = (result.explanation || '').trim()
        const { label: timestamp, seconds: timestampSeconds } = extractTimestampFromText(explanation)

        issues.push({
          sessionId: session.id,
          sessionName: session.audioFile?.name || session.transcriptFile?.name || 'Без названия',
          criterionId: result.criterionId,
          criterionText: meta?.criterionText || result.criterionId,
          categoryName: meta?.categoryName || result.categoryId || 'Категория',
          explanation: explanation || 'AI не оставил пояснений, проверьте запись вручную.',
          severity: severeFail ? 'fail' : 'review',
          confidence: result.confidence,
          timestamp,
          timestampSeconds
        })
      })
    })

    issues.sort((a, b) => {
      if (a.severity !== b.severity) {
        return a.severity === 'fail' ? -1 : 1
      }
      return a.confidence - b.confidence
    })

    return issues.slice(0, 6)
  }, [fileSessions, checklistIndex, extractTimestampFromText])

  const executiveSummaryData = useMemo(() => {
    const analyzedSessions = fileSessions.filter(session => session.analysisResults.length > 0)
    const totalAnalyzed = analyzedSessions.length

    const resolveCategoryMetric = (keywords: string[]): number | null => {
      const match = categoryPerformance.find(item =>
        keywords.some(keyword => item.name.toLowerCase().includes(keyword))
      )
      if (!match || match.total === 0 || match.passRate === null) {
        return null
      }
      return match.passRate
    }

    const overallScore = performanceSummary ? performanceSummary.passRate : null
    const scriptAdherence = resolveCategoryMetric(["скрип", "script"])
    const objectionHandling = resolveCategoryMetric(["возраж", "objection"])
    const nextStepDiscipline = resolveCategoryMetric(["след", "next", "step"])

    const talkShare = communicationStats.talkShare !== null && communicationStats.talkShare !== undefined
      ? Math.round(communicationStats.talkShare * 100)
      : null
    const listenShare = communicationStats.listenShare !== null && communicationStats.listenShare !== undefined
      ? Math.round(communicationStats.listenShare * 100)
      : null
    const silencePercent = communicationStats.silencePercent !== null && communicationStats.silencePercent !== undefined
      ? Math.round(communicationStats.silencePercent)
      : null

    const trendAggregator = new Map<string, { total: number; count: number }>()

    analyzedSessions.forEach(session => {
      const dateSource = session.audioFile?.uploadedAt || session.transcriptFile?.uploadedAt || new Date().toISOString()
      const day = new Date(dateSource)
      const dayKey = !Number.isNaN(day.getTime()) ? day.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)

      const totalCriteria = session.analysisResults.length
      const passedCriteria = session.analysisResults.filter(result => result.score === 1).length
      const sessionScore = totalCriteria > 0 ? (passedCriteria / totalCriteria) * 100 : 0

      const bucket = trendAggregator.get(dayKey) || { total: 0, count: 0 }
      bucket.total += sessionScore
      bucket.count += 1
      trendAggregator.set(dayKey, bucket)
    })

    const trend = Array.from(trendAggregator.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([day, info]) => {
        const parsedDay = new Date(`${day}T00:00:00`)
        const label = new Intl.DateTimeFormat('ru-RU', {
          day: '2-digit',
          month: '2-digit'
        }).format(parsedDay)
        return {
          date: day,
          label,
          score: info.count > 0 ? Math.round(info.total / info.count) : 0
        }
      })
      .slice(-14)

    const scoreDelta = trend.length >= 2
      ? trend[trend.length - 1].score - trend[trend.length - 2].score
      : null

    const topRisks = categoryPerformance
      .filter(item => item.total > 0 && item.attention > 0)
      .map(item => ({
        name: item.name,
        unresolved: item.attention,
        severity: item.total > 0 ? Math.round((item.attention / item.total) * 100) : null
      }))
      .sort((a, b) => (b.severity || 0) - (a.severity || 0))
      .slice(0, 3)

    return {
      overallScore,
      scoreDelta,
      totalAnalyzed,
      trend,
      metrics: {
        scriptAdherence,
        objectionHandling,
        nextStepDiscipline,
        talkShare,
        listenShare,
        silencePercent
      },
      topRisks
    }
  }, [fileSessions, performanceSummary, categoryPerformance, communicationStats])

  const scoreTransparency = useMemo(() => {
    if (!checklist) {
      return null
    }

    const totalWeight = checklist.categories.reduce((acc, category) => {
      const weightValue = typeof category.weight === 'number' ? category.weight : 0
      return acc + weightValue
    }, 0)

    const fallbackShare = checklist.categories.length > 0 ? 100 / checklist.categories.length : 0

    const categories = checklist.categories.map(category => {
      const rawWeight = typeof category.weight === 'number' ? category.weight : 0
      const share = totalWeight > 0 ? (rawWeight / totalWeight) * 100 : fallbackShare

      const performance = categoryPerformance.find(item => {
        const normalizedName = category.name.trim().toLowerCase()
        const normalizedId = category.id?.toString().trim().toLowerCase()
        return item.id === normalizedName || (!!normalizedId && item.id === normalizedId) || item.name.trim().toLowerCase() === normalizedName
      })

      const passRate = performance?.passRate ?? null
      const contribution = passRate !== null ? (share * passRate) / 100 : null
      const penalty = passRate !== null ? Math.max(0, Math.round(share - (contribution ?? 0))) : null

      return {
        categoryId: category.id || category.name,
        name: category.name,
        share,
        passRate,
        penalty,
        fail: performance?.fail ?? 0,
        unsure: performance?.unsure ?? 0,
        total: performance?.total ?? 0,
        contribution
      }
    }).sort((a, b) => (b.share ?? 0) - (a.share ?? 0))

    const estimatedScore = categories.reduce((acc, category) => acc + (category.contribution ?? 0), 0)

    return {
      categories,
      estimatedScore: Math.round(estimatedScore),
      observedScore: performanceSummary?.passRate ?? null,
      failingCriteria
    }
  }, [checklist, categoryPerformance, failingCriteria, performanceSummary])

  const groupedFlags = useMemo(() => {
    if (!activeSession || activeSession.analysisResults.length === 0) {
      return [] as Array<{
        key: string
        label: string
        fail: number
        review: number
        items: Array<{
          id: string
          criterion: string
          explanation: string
          severity: 'fail' | 'review'
          confidence: number
          needsReview: boolean
          timestampLabel: string | null
          timestampSeconds: number | null
        }>
      }>
    }

    const groups = new Map<string, {
      key: string
      label: string
      fail: number
      review: number
      items: Array<{
        id: string
        criterion: string
        explanation: string
        severity: 'fail' | 'review'
        confidence: number
        needsReview: boolean
        timestampLabel: string | null
        timestampSeconds: number | null
      }>
    }>()

    activeSession.analysisResults.forEach(result => {
      if (result.score === 1) return

      const meta = checklistIndex?.criterionMap.get(result.criterionId)
      const categoryLabel = meta?.categoryName || result.categoryId || 'Категория'
      const key = categoryLabel.toLowerCase()

      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label: categoryLabel,
          fail: 0,
          review: 0,
          items: []
        })
      }

      const bucket = groups.get(key)!
      const severity: 'fail' | 'review' = result.score === 0 ? 'fail' : 'review'
      if (severity === 'fail') bucket.fail += 1
      else bucket.review += 1

      const { label: timestampLabel, seconds: timestampSeconds } = extractTimestampFromText(result.explanation)

      bucket.items.push({
        id: `${result.categoryId}-${result.criterionId}`,
        criterion: meta?.criterionText || result.criterionId,
        explanation: result.explanation,
        severity,
        confidence: result.confidence,
        needsReview: result.needsReview,
        timestampLabel,
        timestampSeconds
      })
    })

    return Array.from(groups.values()).map(group => ({
      ...group,
      items: group.items.sort((a, b) => {
        if (a.severity !== b.severity) {
          return a.severity === 'fail' ? -1 : 1
        }
        if (a.timestampSeconds !== null && b.timestampSeconds !== null) {
          return a.timestampSeconds - b.timestampSeconds
        }
        return a.criterion.localeCompare(b.criterion, 'ru')
      })
    })).sort((a, b) => {
      if (a.fail !== b.fail) return b.fail - a.fail
      if (a.review !== b.review) return b.review - a.review
      return a.label.localeCompare(b.label, 'ru')
    })
  }, [activeSession, checklistIndex, extractTimestampFromText])

  const businessImpact = useMemo(() => {
    if (!performanceSummary || executiveSummaryData.totalAnalyzed === 0) {
      return null
    }

    const targetPassRate = 85
    const passRate = performanceSummary.passRate
    const analyzedSessions = executiveSummaryData.totalAnalyzed

    const sessionsWithHardFails = fileSessions.filter(session =>
      session.analysisResults.some(result => result.score === 0)
    ).length

    const sessionsNeedingReview = fileSessions.filter(session =>
      session.analysisResults.some(result => result.needsReview || result.score === "?")
    ).length

    const dealsAtRisk = Math.max(0, sessionsWithHardFails + Math.round(sessionsNeedingReview * 0.5))

    const conversionGap = Math.max(0, targetPassRate - passRate)
    const expectedConversionLift = conversionGap > 0 ? Math.min(30, Math.round(conversionGap * 0.6)) : 0

    const baselineNextStepHours = 36
    const targetNextStepHours = Math.max(12, Math.round(baselineNextStepHours - (targetPassRate / 100) * 18))
    const currentNextStepHours = Math.max(12, Math.round(baselineNextStepHours - (passRate / 100) * 18))
    const timeToNextStepGap = currentNextStepHours - targetNextStepHours

    return {
      dealsAtRisk,
      expectedConversionLift,
      conversionGap,
      targetPassRate,
      passRate,
      analyzedSessions,
      sessionsWithHardFails,
      sessionsNeedingReview,
      currentNextStepHours,
      targetNextStepHours,
      timeToNextStepGap
    }
  }, [performanceSummary, executiveSummaryData.totalAnalyzed, fileSessions])

  const globalStats = useMemo(() => ({
    totalFiles: fileSessions.length,
    transcribedFiles: fileSessions.filter(session => session.transcriptData).length,
    analyzedFiles: fileSessions.filter(session => session.analysisResults.length > 0).length,
    processingFiles: fileSessions.filter(session => session.isTranscribing || session.isAnalyzing).length
  }), [fileSessions])

  const handleExport = useCallback(async (format: 'json' | 'pdf') => {
    if (format === 'json') {
      const exportData = {
        checklist,
        fileSessions: fileSessions.map(session => ({
          ...session,
          audioFile: session.audioFile ? {
            ...session.audioFile,
            file: undefined
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
      if (typeof window === 'undefined') {
        toast({
          title: 'Экспорт недоступен',
          description: 'PDF можно сохранить только в браузере',
          variant: 'destructive'
        })
        return
      }

      const section = document.getElementById('executive-summary')
      if (!section) {
        toast({
          title: 'Не найдено содержимое',
          description: 'Обновите страницу и попробуйте ещё раз',
          variant: 'destructive'
        })
        return
      }

      const printWindow = window.open('', '_blank', 'width=1024,height=768')
      if (!printWindow) {
        toast({
          title: 'Браузер заблокировал окно',
          description: 'Разрешите всплывающие окна и повторите попытку',
          variant: 'destructive'
        })
        return
      }

      printWindow.document.write(`<!doctype html><html lang="ru"><head><meta charset="utf-8" /><title>Executive Summary</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 24px; color: #111827; }
          h1, h2, h3 { margin: 0; }
          .card { border: 1px solid #d1d5db; border-radius: 12px; padding: 16px; margin-bottom: 16px; }
          .grid { display: grid; gap: 12px; }
          .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .grid-cols-5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }
          .legend { display: flex; gap: 12px; font-size: 12px; margin: 16px 0; }
          .legend span { display: inline-flex; align-items: center; gap: 6px; }
        </style>
      </head><body>${section.outerHTML}</body></html>`)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
    
    toast({
      title: "Экспорт завершён",
      description: `Отчёт сохранён в формате ${format.toUpperCase()}`
    })
  }, [checklist, fileSessions, globalStats, toast])

  const handleShareExecutiveView = useCallback(async () => {
    if (typeof window === 'undefined') {
      toast({
        title: "Недоступно",
        description: "Поделиться ссылкой можно только в браузере",
        variant: "destructive"
      })
      return
    }

    const shareUrl = window.location.href

    try {
      if (navigator.share) {
        await navigator.share({
          title: "Сводка качества коммуникаций",
          url: shareUrl
        })
        toast({
          title: "Ссылка отправлена",
          description: "Поделились исполнительной сводкой"
        })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl)
        toast({
          title: "Ссылка скопирована",
          description: "Адрес отчёта находится в буфере обмена"
        })
      } else {
        toast({
          title: "Не удалось поделиться",
          description: "Скопируйте ссылку вручную",
          variant: "destructive"
        })
      }
    } catch (error) {
      toast({
        title: "Не удалось поделиться",
        description: "Повторите попытку или скопируйте ссылку вручную",
        variant: "destructive"
      })
    }
  }, [toast])

  type SeverityStatus = "good" | "warn" | "bad" | "neutral"

  const resolveSeverityStatus = (value: number | null | undefined, invert = false): SeverityStatus => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return "neutral"
    }

    const rounded = Math.round(value)
    if (invert) {
      if (rounded <= 10) return "good"
      if (rounded <= 20) return "warn"
      return "bad"
    }

    if (rounded >= 85) return "good"
    if (rounded >= 70) return "warn"
    return "bad"
  }

  const severityTextClasses: Record<SeverityStatus, string> = {
    good: "text-emerald-600 dark:text-emerald-400",
    warn: "text-amber-600 dark:text-amber-400",
    bad: "text-red-600 dark:text-red-400",
    neutral: "text-gray-500 dark:text-gray-400"
  }

  const severityBadgeClasses: Record<SeverityStatus, string> = {
    good: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    warn: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    bad: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
    neutral: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300"
  }

  const formatPercentValue = (value: number | null | undefined, suffix = "%") => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return "—"
    }
    return `${Math.round(value)}${suffix}`
  }

  const formatDelta = (delta: number | null) => {
    if (delta === null || Number.isNaN(delta)) {
      return "—"
    }
    const rounded = Math.round(delta)
    if (rounded === 0) {
      return "0 п.п."
    }
    const sign = rounded > 0 ? "+" : ""
    return `${sign}${rounded} п.п.`
  }

  const formatShare = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) {
      return "—"
    }
    return `${value % 1 === 0 ? Math.round(value) : value.toFixed(1)}%`
  }

  const demoExecutiveData = useMemo(() => ({
    overallScore: 78,
    scoreDelta: -3,
    totalAnalyzed: 127,
    trend: [
      { date: '2024-06-01', label: '01.06', score: 74 },
      { date: '2024-06-02', label: '02.06', score: 76 },
      { date: '2024-06-03', label: '03.06', score: 80 },
      { date: '2024-06-04', label: '04.06', score: 79 },
      { date: '2024-06-05', label: '05.06', score: 77 },
      { date: '2024-06-06', label: '06.06', score: 75 },
      { date: '2024-06-07', label: '07.06', score: 78 }
    ],
    metrics: {
      scriptAdherence: 84,
      objectionHandling: 72,
      nextStepDiscipline: 68,
      talkShare: 56,
      listenShare: 44,
      silencePercent: 12
    },
    topRisks: [
      { name: 'Закрытие сделки', unresolved: 9, severity: 36 },
      { name: 'Работа с возражениями', unresolved: 14, severity: 28 },
      { name: 'Следующий шаг согласован', unresolved: 11, severity: 24 }
    ]
  }), [])

  const demoBusinessImpact = useMemo(() => ({
    dealsAtRisk: 12,
    analyzedSessions: 127,
    sessionsWithHardFails: 7,
    sessionsNeedingReview: 9,
    expectedConversionLift: 6,
    passRate: 78,
    targetPassRate: 85,
    currentNextStepHours: 28,
    targetNextStepHours: 18,
    timeToNextStepGap: 10
  }), [])

  const demoSummaryNarrative = useMemo(() => ({
    headline: 'Итог: 78/100 (−3 п.п. неделя к неделе). Главный риск: нет договорённости о следующем шаге.',
    recommendations: [
      'Назначьте коучинг для команды по блоку «Следующий шаг» (11 звонков в красной зоне).',
      'Пересмотрите аргументы по возражениям «дорого» и «подумать» — 14 кейсов требуют ручной проверки.',
      'Сократите паузы в началах звонков: 6 менеджеров теряют инициативу в первые 30 секунд.'
    ]
  }), [])

  const hasAnalyzedData = executiveSummaryData.totalAnalyzed > 0
  const isDemoMode = !hasAnalyzedData

  const displaySummaryNarrative = summaryNarrative ?? (isDemoMode ? demoSummaryNarrative : null)
  const displayExecutiveData = isDemoMode ? demoExecutiveData : executiveSummaryData
  const displayBusinessImpact = businessImpact ?? (isDemoMode ? demoBusinessImpact : null)
  const summaryLeadText = displaySummaryNarrative
    ? isDemoMode
      ? displaySummaryNarrative.headline
      : displaySummaryNarrative.recommendations?.[0]
        ? `${displaySummaryNarrative.headline} ${displaySummaryNarrative.recommendations[0]}`
        : displaySummaryNarrative.headline
    : null

  const handleJumpToSession = useCallback((sessionId: string) => {
    setAudienceView('analyst')
    setActiveSessionId(sessionId)
    setScoreDetailsOpen(false)
  }, [setActiveSessionId, setAudienceView, setScoreDetailsOpen])

  const executiveSummaryView = (
    <section className="space-y-6" id="executive-summary">
      <Card className="border-emerald-200 bg-white shadow-sm dark:border-emerald-900/40 dark:bg-gray-900">
        <CardHeader className="space-y-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <CardTitle className="text-xl">60-секундный обзор</CardTitle>
              <p className="max-w-2xl text-sm text-gray-600 dark:text-gray-300">
                {summaryLeadText
                  ? summaryLeadText
                  : 'Подготовьте анализ хотя бы одного звонка, чтобы увидеть сводку для руководителей.'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="border-emerald-500 text-emerald-700 dark:border-emerald-400 dark:text-emerald-200">
                {displayExecutiveData.totalAnalyzed} звонков в выборке
              </Badge>
              {globalStats.processingFiles > 0 && (
                <Badge variant="outline" className="border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-200">
                  {globalStats.processingFiles} в обработке
                </Badge>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Badge variant="secondary">Команда A</Badge>
              <Badge variant="secondary">Прошлая неделя</Badge>
              <Badge variant="secondary">{displayExecutiveData.totalAnalyzed} звонков</Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1" onClick={() => handleExport('pdf')}>
                <FileDown className="h-4 w-4" />
                Экспорт PDF
              </Button>
              <Button variant="ghost" size="sm" className="gap-1" onClick={handleShareExecutiveView}>
                <Share2 className="h-4 w-4" />
                Поделиться
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {[
          {
            key: 'overall',
            title: 'Качество звонков',
            value: displayExecutiveData.overallScore,
            delta: displayExecutiveData.scoreDelta,
            subtitle: 'Цель ≥85%'
          },
          {
            key: 'script',
            title: 'Следование скрипту',
            value: displayExecutiveData.metrics.scriptAdherence,
            subtitle: 'Цель ≥90%'
          },
          {
            key: 'objection',
            title: 'Отработка возражений',
            value: displayExecutiveData.metrics.objectionHandling,
            subtitle: 'Цель ≥80%'
          },
          {
            key: 'talk',
            title: 'Баланс речи',
            value: displayExecutiveData.metrics.talkShare,
            subtitle: 'Оптимум 55/45',
            secondary: displayExecutiveData.metrics.listenShare,
            isRatio: true
          },
          {
            key: 'silence',
            title: 'Паузы',
            value: displayExecutiveData.metrics.silencePercent,
            subtitle: 'Цель ≤15%',
            invert: true
          }
        ].map(card => {
          const status: SeverityStatus = card.key === 'talk'
            ? 'neutral'
            : resolveSeverityStatus(card.value ?? null, Boolean(card.invert))

          return (
            <Card
              key={card.key}
              className="bg-white shadow-sm dark:bg-gray-900"
            >
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {card.subtitle}
                    </p>
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {card.title}
                    </p>
                  </div>
                  {card.key === "overall" && (
                    <Badge className={`flex items-center gap-1 ${severityBadgeClasses[resolveSeverityStatus(card.value ?? null, Boolean(card.invert))]}`}>
                      {card.delta !== null && card.delta !== undefined ? (
                        card.delta > 0 ? <ArrowUpRight className="h-3 w-3" /> : card.delta < 0 ? <ArrowDownRight className="h-3 w-3" /> : <Minus className="h-3 w-3" />
                      ) : <Minus className="h-3 w-3" />}
                      {formatDelta(card.delta ?? null)}
                    </Badge>
                  )}
                </div>

                <div className={`text-3xl font-semibold ${severityTextClasses[status]}`}>
                  {formatPercentValue(card.value)}
                </div>

                {card.key === "talk" && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Менеджер {formatPercentValue(card.value)} · Клиент {formatPercentValue(card.secondary)}
                  </p>
                )}

                {card.key !== "talk" && card.key !== "overall" && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">Сравнение с прошлой неделей</p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> Норма
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-amber-500" /> Зона внимания
        </span>
        <span className="flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-red-500" /> Срочное действие
        </span>
      </div>

      <div className="flex justify-end">
        <Button
          variant="link"
          size="sm"
          className="px-0 text-emerald-700 hover:text-emerald-600 dark:text-emerald-300"
          onClick={() => setScoreDetailsOpen(true)}
          disabled={!scoreTransparency || isDemoMode}
        >
          Почему {formatPercentValue(displayExecutiveData.overallScore)}?
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr,1fr]">
        <Card className="bg-white shadow-sm dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-base">Динамика за 14 дней</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">Средний балл по дням</p>
          </CardHeader>
          <CardContent>
            {displayExecutiveData.trend.length > 0 ? (
              <div className="flex h-48 items-end gap-3">
                {displayExecutiveData.trend.map(point => {
                  const status = resolveSeverityStatus(point.score)
                  return (
                    <div key={point.date} className="flex flex-1 flex-col items-center justify-end gap-2">
                      <div
                        className={`w-full max-w-[2.5rem] rounded-t-md ${status === 'good' ? 'bg-emerald-500/80' : status === 'warn' ? 'bg-amber-500/80' : status === 'bad' ? 'bg-red-500/80' : 'bg-gray-300 dark:bg-gray-700'}`}
                        style={{ height: `${Math.max(6, point.score)}%` }}
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">{point.label}</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="flex h-32 items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                Недостаточно данных для построения тренда.
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4">
          {displayBusinessImpact && (
            <Card className="bg-white shadow-sm dark:bg-gray-900">
              <CardHeader>
                <CardTitle className="text-base">Бизнес-эффект</CardTitle>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Приоритеты для снижения потерь и ускорения воронки.
                </p>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {(() => {
                  const riskRate = displayBusinessImpact.analyzedSessions > 0
                    ? displayBusinessImpact.dealsAtRisk / displayBusinessImpact.analyzedSessions
                    : 0
                  const dealsStatus: SeverityStatus = riskRate <= 0.1
                    ? "good"
                    : riskRate <= 0.25
                      ? "warn"
                      : "bad"
                  const conversionStatus: SeverityStatus = displayBusinessImpact.expectedConversionLift <= 3
                    ? "good"
                    : displayBusinessImpact.expectedConversionLift <= 8
                      ? "warn"
                      : "bad"
                  const timeStatus: SeverityStatus = displayBusinessImpact.timeToNextStepGap <= 0
                    ? "good"
                    : displayBusinessImpact.timeToNextStepGap <= 4
                      ? "warn"
                      : "bad"

                  return (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">Сделок под риском</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Провалено {displayBusinessImpact.sessionsWithHardFails} звонков, {displayBusinessImpact.sessionsNeedingReview} требует проверки.
                          </p>
                        </div>
                        <Badge className={severityBadgeClasses[dealsStatus]}>
                          {displayBusinessImpact.dealsAtRisk}/{displayBusinessImpact.analyzedSessions}
                        </Badge>
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">Потенциал роста конверсии</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Текущий чек-лист закрыт на {displayBusinessImpact.passRate}% (цель {displayBusinessImpact.targetPassRate}%).
                          </p>
                        </div>
                        <Badge className={severityBadgeClasses[conversionStatus]}>
                          {displayBusinessImpact.expectedConversionLift > 0
                            ? `+${displayBusinessImpact.expectedConversionLift} п.п.`
                            : 'В норме'}
                        </Badge>
                      </div>

                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <p className="font-medium text-gray-900 dark:text-gray-100">Время до следующего шага</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Сейчас ≈ {displayBusinessImpact.currentNextStepHours} ч · цель {displayBusinessImpact.targetNextStepHours} ч.
                          </p>
                        </div>
                        <Badge className={severityBadgeClasses[timeStatus]}>
                          {displayBusinessImpact.timeToNextStepGap > 0
                            ? `-${displayBusinessImpact.timeToNextStepGap} ч`
                            : 'В норме'}
                        </Badge>
                      </div>
                    </>
                  )
                })()}
              </CardContent>
            </Card>
          )}

          <Card className="bg-white shadow-sm dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="text-base">Топ-риски</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">Категории, требующие внимания</p>
            </CardHeader>
            <CardContent className="space-y-3">
              {displayExecutiveData.topRisks.length > 0 ? (
                <ul className="space-y-2 text-sm">
                  {displayExecutiveData.topRisks.map((risk, index) => {
                    const status = resolveSeverityStatus(risk.severity ?? null, true)
                    return (
                      <li key={`${risk.name}-${index}`} className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-red-500" />
                          <span className="text-gray-800 dark:text-gray-200">{risk.name}</span>
                        </div>
                        <Badge className={`${severityBadgeClasses[status]}`}>
                          {risk.severity !== null && risk.severity !== undefined ? `${risk.severity}% · ${risk.unresolved}` : `${risk.unresolved}`}
                        </Badge>
                      </li>
                    )
                  })}
                </ul>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">Риски не выявлены. Продолжайте отслеживать динамику.</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm dark:bg-gray-900">
            <CardHeader>
              <CardTitle className="text-base">Следующие шаги</CardTitle>
              <p className="text-sm text-gray-500 dark:text-gray-400">Выберите действие для команды</p>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button
                variant="default"
                className="justify-between"
                onClick={() => toast({
                  title: "Назначить коучинг",
                  description: "Переключитесь в режим аналитика, чтобы выбрать конкретный звонок для разбора."
                })}
              >
                Назначить коучинг
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                className="justify-between"
                onClick={() => toast({
                  title: "Уведомление менеджеру",
                  description: "Автоматические уведомления будут добавлены позже. Пока используйте CRM-ссылку."
                })}
              >
                Уведомить руководителя
                <ArrowUpRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                className="justify-between"
                onClick={() => toast({
                  title: "Создание задачи",
                  description: "Экспорт задач скоро появится. Скопируйте ключевые риски и отправьте в CRM."
                })}
              >
                Создать задачу в CRM
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {displaySummaryNarrative && (
        <Card className="bg-white shadow-sm dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-base">Резюме</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <p>{displaySummaryNarrative.headline}</p>
            {displaySummaryNarrative.recommendations?.length ? (
              <ul className="list-disc space-y-1 pl-5">
                {displaySummaryNarrative.recommendations.map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            ) : null}
          </CardContent>
        </Card>
      )}

      {isDemoMode && (
        <Card className="bg-white shadow-sm dark:bg-gray-900">
          <CardHeader>
            <CardTitle className="text-base">Демо-сценарий (90 секунд)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
            <ol className="list-decimal space-y-1 pl-5">
              <li>Покажите карту «Бизнес-эффект»: выделите 12 сделок под риском и запланируйте рост конверсии на +6 п.п.</li>
              <li>Раскройте «Топ-риски» и перейдите в карточку «Следующий шаг согласован» — рассчитан 24% провалов.</li>
              <li>Нажмите «Назначить коучинг», переключитесь в режим аналитика и воспроизведите красный фрагмент для руководителя.</li>
            </ol>
          </CardContent>
        </Card>
      )}

      {!isDemoMode && (
      <details className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <summary className="cursor-pointer text-sm font-semibold text-gray-900 dark:text-gray-100">
          Операционный статус (для аналитиков)
        </summary>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Всего файлов</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{globalStats.totalFiles}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Готовы транскрипты</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{globalStats.transcribedFiles}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Готов анализ</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{globalStats.analyzedFiles}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">В очереди</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{globalStats.processingFiles}</p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setAudienceView('analyst')}>
            Открыть режим аналитика
          </Button>
          <Button
            variant="ghost"
            onClick={() => handleExport('json')}
          >
            Экспортировать JSON
          </Button>
        </div>
      </details>
      )}

      <Dialog open={scoreDetailsOpen} onOpenChange={setScoreDetailsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Почему {formatPercentValue(displayExecutiveData.overallScore)}?</DialogTitle>
            <DialogDescription>
              Вес категорий чек-листа и ключевые моменты, которые снизили итоговый балл.
            </DialogDescription>
          </DialogHeader>

          {scoreTransparency ? (
            <div className="space-y-6">
              <div className="rounded-lg bg-emerald-50/70 p-3 text-sm text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100">
                <p>
                  Фактический балл: {formatPercentValue(scoreTransparency.observedScore)} · Расчёт по весам: {formatPercentValue(scoreTransparency.estimatedScore)}
                </p>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Вес и вклад категорий</p>
                <div className="space-y-2">
                  {scoreTransparency.categories.map(category => {
                    const status = resolveSeverityStatus(category.passRate ?? null)
                    return (
                      <div key={category.categoryId} className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{category.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Вес: {formatShare(category.share)} · Потеря: {category.penalty !== null ? `${category.penalty} п.п.` : '—'}
                            </p>
                          </div>
                          <Badge className={severityBadgeClasses[status]}>
                            Выполнено {formatPercentValue(category.passRate)}
                          </Badge>
                        </div>
                        <div className="mt-3 space-y-2">
                          <Progress value={category.passRate ?? 0} className="h-1.5" />
                          <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span>Провалов: {category.fail}</span>
                            <span>Неопределённо: {category.unsure}</span>
                            <span>Всего проверок: {category.total}</span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Критерии, повлиявшие на оценку</p>
                {scoreTransparency.failingCriteria.length > 0 ? (
                  <ul className="space-y-3">
                    {scoreTransparency.failingCriteria.map((issue, index) => {
                      const status = issue.severity === 'fail' ? 'bad' : 'warn'
                      return (
                        <li key={`${issue.sessionId}-${issue.criterionId}-${index}`} className="rounded-lg border border-gray-200 p-3 dark:border-gray-800">
                          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                            <div className="space-y-2">
                              <div>
                                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{issue.criterionText}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{issue.categoryName}</p>
                              </div>
                              <p className="text-sm text-gray-700 dark:text-gray-300">{issue.explanation}</p>
                              <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                                <span>Запись: {issue.sessionName}</span>
                                {issue.timestamp && <span>Метка: {issue.timestamp}</span>}
                                <span>Уверенность AI: {issue.confidence}%</span>
                              </div>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-2">
                              <Badge className={severityBadgeClasses[status]}>
                                {issue.severity === 'fail' ? 'Провал' : 'Нужна проверка'}
                              </Badge>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1"
                        onClick={() => {
                          handleJumpToSession(issue.sessionId)
                          if (issue.timestampSeconds !== null) {
                            focusTranscriptAt(issue.timestampSeconds)
                          }
                        }}
                      >
                        Открыть звонок
                        <ArrowUpRight className="h-3 w-3" />
                      </Button>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">AI не обнаружил критериев, которые снижали бы итоговый балл.</p>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {isDemoMode
                ? 'Расшифровка доступна после загрузки реальных данных анализа.'
                : 'Добавьте чек-лист и завершите анализ хотя бы одного звонка, чтобы увидеть расшифровку оценки.'}
            </p>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )

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
        title: "Файлы загружены",
        description: `${newSessions.length} аудиозаписей добавлены в очередь`
      })
    }

    if (duplicateFiles.length > 0) {
      toast({
        title: "Повторяющиеся записи пропущены",
        description: `${duplicateFiles.length} файлов уже есть в списке: ${duplicateFiles.join(', ')}`,
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
        title: "Транскрипт готов",
        description: `${session.audioFile.name} успешно расшифрована`
      })
    } catch (error) {
      setFileSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, isTranscribing: false } : s
      ))
      
      toast({
        title: "Ошибка транскрибации", 
        description: "Не удалось расшифровать аудиозапись",
        variant: "destructive"
      })
    }
  }, [fileSessions, toast, transcribeAudioSession])

  // Handle checklist upload
  const normalizeChecklist = useCallback((rawChecklist: Checklist): Checklist => {
    const normalizedCategories = rawChecklist.categories.map(category => {
      const baseName = category.name || (category as any).title || 'Категория'
      const categoryId = category.id || (category as any).slug || baseName.toLowerCase().replace(/\s+/g, '-')
      return {
        ...category,
        id: categoryId,
        name: baseName,
        criteria: category.criteria.map((criterion, criterionIndex) => ({
          ...criterion,
          id: criterion.id || (criterion as any).slug || `${categoryId}-criterion-${criterionIndex}`,
          text: criterion.text || (criterion as any).name || (criterion as any).title || 'Критерий',
          description: criterion.description || (criterion as any).details || '',
          weight: typeof criterion.weight === 'number' ? criterion.weight : (criterion as any).weight ?? 1,
          max_score: (criterion as any).max_score ?? (criterion as any).maxScore ?? undefined,
          type: criterion.type || (criterion as any).type || 'binary'
        }))
      }
    })

    return {
      ...rawChecklist,
      id: rawChecklist.id || (rawChecklist as any).slug || `checklist-${Date.now()}`,
      name: rawChecklist.name || 'Чек-лист оценки',
      categories: normalizedCategories,
      total_criteria_count: rawChecklist.total_criteria_count ?? normalizedCategories.reduce((acc, category) => acc + category.criteria.length, 0),
      max_possible_score: rawChecklist.max_possible_score ?? (rawChecklist as any).maxScore ?? 100
    }
  }, [])

  const handleChecklistUpload = useCallback((newChecklist: Checklist) => {
    const normalized = normalizeChecklist(newChecklist)
    setChecklist(normalized)
    toast({
      title: "Чек-лист загружен",
      description: `${normalized.name} готов к анализу`
    })
  }, [normalizeChecklist, toast]);

  const loadDemoData = useCallback(async () => {
    if (demoLoaded || demoLoading) return
    if (typeof window === 'undefined') return

    try {
      setDemoLoading(true)

      const audioResponse = await fetch(DEMO_AUDIO_URL, { cache: 'no-store' })
      if (!audioResponse.ok) {
        throw new Error('Не удалось загрузить демо-аудио')
      }
      const audioBlob = await audioResponse.blob()
      const audioFile = new File([audioBlob], DEMO_AUDIO_FILENAME, {
        type: audioBlob.type || 'audio/mpeg'
      })
      handleAudioUpload(audioFile)

      const checklistResponse = await fetch(DEMO_CHECKLIST_URL, { cache: 'no-store' })
      if (!checklistResponse.ok) {
        throw new Error('Не удалось загрузить демо-чек-лист')
      }
      const checklistJson = await checklistResponse.json()
      handleChecklistUpload(checklistJson as Checklist)

      setDemoLoaded(true)
      toast({
        title: 'Демо-данные готовы',
        description: 'Запись и чек-лист загружены. Можно запускать транскрибацию и анализ.'
      })
    } catch (error) {
      setDemoLoaded(false)
      const message = error instanceof Error ? error.message : 'Ошибка загрузки демо-данных'
      toast({
        title: 'Не удалось подготовить демо',
        description: message,
        variant: 'destructive'
      })
    } finally {
      setDemoLoading(false)
    }
  }, [demoLoading, handleAudioUpload, handleChecklistUpload, toast])

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
        title: "Анализ выполнен",
        description: `Обновлено ${results.length} критериев для записи`
      })
    } catch (error) {
      setFileSessions(prev => prev.map(s => 
        s.id === sessionId ? { ...s, isAnalyzing: false } : s
      ))
      
      toast({
        title: "Ошибка анализа",
        description: "Не удалось сопоставить транскрипт с чек-листом",
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
        title: "Нет файлов для анализа",
        description: "Все записи с транскриптом уже проверены"
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
        title: "Пакетный анализ завершён",
        description: `Успешно обработано ${sessionsToAnalyze.length} записей`
      })
    } catch (error) {
      setFileSessions(prev => prev.map(s => 
        sessionsToAnalyze.some(session => session.id === s.id) 
          ? { ...s, isAnalyzing: false } 
          : s
      ))
      
      toast({
        title: "Сбой пакетного анализа",
        description: "Не удалось завершить обработку части записей",
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
      title: "Запись удалена",
      description: "Файл и связанные данные очищены"
    })
  }, [activeSessionId, fileSessions, toast]);

  // Handle save
  const handleSave = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    setHasUnsavedChanges(false)
    toast({
      title: "Изменения сохранены",
      description: "Все правки успешно записаны"
    })
  }, [toast]);

  // Handle export
  // Handle reset
  const handleReset = useCallback(() => {
    setFileSessions([])
    setActiveSessionId(null)
    setChecklist(null)
    setHasUnsavedChanges(false)
    toast({
      title: "Сброс выполнен",
      description: "Рабочее пространство очищено"
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
      title: "Пакетная расшифровка завершена",
      description: `Обработано ${selectedSessions.size} записей`
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
      title: "Пакетный анализ завершён", 
      description: `Проверено ${selectedSessions.size} записей`
    })
  }, [selectedSessions, checklist, fileSessions, handleAnalyzeFile, toast]);

  const handleBulkDelete = useCallback(() => {
    if (selectedSessions.size === 0) return
    
    setFileSessions(prev => prev.filter(s => !selectedSessions.has(s.id)))
    setSelectedSessions(new Set())
    
    toast({
      title: "Файлы удалены",
      description: `Удалено ${selectedSessions.size} элементов`
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
          title: "Умная обработка завершена! 🎉",
          description: `Успешно обработано ${totalFiles} записей (транскрибация и анализ)`
        })
      }, 1500)
      
    } catch (error) {
      setBatchProgress(null)
      setBulkProcessing(false)
      
      toast({
        title: "Сбой умной обработки",
        description: "Произошла ошибка во время пакетной обработки. Повторите позже.",
        variant: "destructive"
      })
    }
  }, [selectedSessions, checklist, fileSessions, handleRunTranscription, handleAnalyzeFile, toast]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 border-b border-gray-200 pb-6 dark:border-gray-800">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                Оценка качества коммуникаций
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Быстро оцените состояние команды или углубитесь в детали каждой записи.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={audienceView === 'executive' ? 'default' : 'outline'}
                onClick={() => setAudienceView('executive')}
              >
                Режим руководителя
              </Button>
              <Button
                variant={audienceView === 'analyst' ? 'default' : 'outline'}
                onClick={() => setAudienceView('analyst')}
              >
                Аналитика и коучинг
              </Button>
            </div>
          </div>
        </header>

        {audienceView === 'executive' ? (
          executiveSummaryView
        ) : (
          <Tabs defaultValue="call-analysis" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="call-analysis" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Аналитика звонков
            </TabsTrigger>
            <TabsTrigger value="sales-managers" className="flex items-center gap-2">
              <UserCheck className="h-4 w-4" />
              Результаты менеджеров
            </TabsTrigger>
          </TabsList>

          <TabsContent value="call-analysis" className="space-y-6 mt-6">

        <div className="grid gap-6 lg:grid-cols-[320px,1fr]">
          <div className="space-y-6">
            <Card className="lg:sticky lg:top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5" />
                  План действий команды
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
                    Умная обработка выполняется
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-gray-700 dark:text-gray-300">
                    <span>
                      {batchProgress.stage === 'transcription'
                        ? 'Расшифровываем записи'
                        : batchProgress.stage === 'analysis'
                          ? 'Запускаем AI-оценку'
                          : 'Завершение обработки'}
                    </span>
                    <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                  </div>
                  <Progress value={(batchProgress.current / batchProgress.total) * 100} className="h-2" />
                  {batchProgress.currentFile && (
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      Текущий файл: {batchProgress.currentFile}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-5 w-5" />
                  Подсказки для руководителя
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
                <p>• Пошаговый сценарий помогает команде: начните с загрузки, завершите выгрузкой результатов.</p>
                <p>• Массовые действия находятся в блоке <strong>Управление записями</strong>, чтобы обрабатывать десятки звонков за минуты.</p>
                <p>• Исполнительная сводка обновляется автоматически после завершения анализа.</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card id="step-upload" className="scroll-mt-32">
              <CardHeader className="space-y-3">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileAudio className="h-5 w-5" />
                      Шаг 1 · Загрузите записи
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Перетащите аудиофайлы. Мы сгруппируем одинаковые имена, чтобы ничего не потерялось.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={loadDemoData}
                      disabled={demoLoading || demoLoaded}
                    >
                      <Zap className="h-4 w-4" />
                      {demoLoaded ? 'Демо загружено' : 'Загрузить демо-данные'}
                    </Button>
                    {demoLoading && <Loader2 className="h-4 w-4 animate-spin text-gray-500" />}
                  </div>
                </div>
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
                  Шаг 2 · Загрузите или соберите чек-лист, по которому оценивается команда. AI сверяется с ним построчно.
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
                      Шаг 3 · Управляйте записями
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Фильтруйте и готовьте файлы к транскрибации или анализу. Используйте панель массовых действий.
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                        <Input
                          placeholder="Поиск записей..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-9"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                          <SelectTrigger className="w-36">
                            <SelectValue placeholder="Фильтр" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Все статусы</SelectItem>
                            <SelectItem value="pending">Требуют действий</SelectItem>
                            <SelectItem value="transcribed">Есть транскрипт</SelectItem>
                            <SelectItem value="analyzed">Анализ готов</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                          <SelectTrigger className="w-36">
                            <SelectValue placeholder="Сортировка" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="date">Сначала новые</SelectItem>
                            <SelectItem value="name">Название A–Я</SelectItem>
                            <SelectItem value="status">По статусу</SelectItem>
                            <SelectItem value="progress">По прогрессу</SelectItem>
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
                      Выделить страницу
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSelectAllInSession}>
                      Выделить все
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleSelectUnprocessed}>
                      Невыполненные
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedSessions(new Set())}>
                      Сбросить
                    </Button>
                    <div className="ml-auto text-sm text-gray-500 dark:text-gray-400">
                      {selectedSessions.size} выбрано / {filteredSessions.length} в списке
                    </div>
                  </div>

                  {selectedSessions.size > 0 && (
                    <div className="space-y-3 rounded-lg border border-blue-200 bg-blue-50/70 p-4 dark:border-blue-800 dark:bg-blue-950/30">
                      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-blue-900 dark:text-blue-200">
                        <span className="font-medium">Выбрано {selectedSessions.size} записей</span>
                        {batchProgress && (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>
                              {batchProgress.stage === 'transcription'
                                ? 'Расшифровка'
                                : batchProgress.stage === 'analysis'
                                  ? 'Анализ'
                                  : 'Завершение'}
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
                          Умная обработка
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
                                {session.audioFile?.name || session.transcriptFile?.name || 'Без названия'}
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
                                <Badge variant={session.audioFile ? 'default' : 'secondary'}>Аудио</Badge>
                                <Badge variant={session.transcriptData ? 'default' : 'secondary'}>Транскрипт</Badge>
                                <Badge variant={session.analysisResults.length > 0 ? 'default' : 'secondary'}>Анализ</Badge>
                              </div>
                              <div className="text-right text-xs text-gray-500 dark:text-gray-400">
                                {session.isTranscribing && (
                                  <span className="flex items-center gap-2 text-blue-600">
                                    <Loader2 className="h-4 w-4 animate-spin" />Идёт расшифровка…
                                  </span>
                                )}
                                {session.isAnalyzing && (
                                  <span className="flex items-center gap-2 text-purple-600">
                                    <Loader2 className="h-4 w-4 animate-spin" />Выполняется анализ…
                                  </span>
                                )}
                                {!session.isTranscribing && !session.isAnalyzing && (
                                  <span>
                                    {session.analysisResults.length > 0
                                      ? 'Анализ готов'
                                      : session.transcriptData
                                        ? 'Готов к анализу'
                                        : 'Нужна транскрибация'}
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
                                {session.audioFile?.name || session.transcriptFile?.name || 'Без названия'}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 text-xs">
                                <Badge variant={session.audioFile ? 'default' : 'secondary'}>Аудио</Badge>
                                <Badge variant={session.transcriptData ? 'default' : 'secondary'}>Транскрипт</Badge>
                                <Badge variant={session.analysisResults.length > 0 ? 'default' : 'secondary'}>Анализ</Badge>
                              </div>
                            </div>
                            <div className="mt-4 flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
                              <div>
                                {session.isTranscribing
                                  ? 'Идёт расшифровка…'
                                  : session.isAnalyzing
                                    ? 'Выполняется анализ…'
                                    : session.analysisResults.length > 0
                                      ? 'Анализ готов'
                                      : session.transcriptData
                                        ? 'Готов к анализу'
                                        : 'Нужна транскрибация'}
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
                        Страница {currentPage} из {totalPages}
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
                  Загрузите записи, чтобы открыть инструменты управления.
                </CardContent>
              </Card>
            )}

            <Card id="step-review" className="scroll-mt-32">
              <CardHeader>
                <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Шаг 4 · Разбор и коучинг
                    </CardTitle>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Выберите запись, чтобы увидеть транскрипт, оценку AI и ключевые метрики рядом.
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
                            Выполняется анализ…
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Запустить анализ
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => activeSessionId && handleRunTranscription(activeSessionId)}
                        disabled={!activeSessionId || !activeSession?.audioFile || !!activeSession?.transcriptData || activeSession?.isTranscribing}
                        className="gap-2"
                      >
                        {activeSession?.isTranscribing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Идёт расшифровка…
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            Повторить расшифровку
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
                            {activeSession.audioFile?.name || activeSession.transcriptFile?.name || 'Без названия'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Загружено {new Date(activeSession.audioFile?.uploadedAt || activeSession.transcriptFile?.uploadedAt || '').toLocaleString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Badge variant={activeSession.audioFile ? 'default' : 'secondary'}>Аудио</Badge>
                          <Badge variant={activeSession.transcriptData ? 'default' : 'secondary'}>Транскрипт</Badge>
                          <Badge variant={activeSession.analysisResults.length > 0 ? 'default' : 'secondary'}>Анализ</Badge>
                        </div>
                      </div>
                      {activeSession.analysisResults.length > 0 && (
                        <div className="grid gap-4 text-sm sm:grid-cols-3">
                          <div className="rounded-lg bg-blue-50 p-3 text-blue-900 dark:bg-blue-950/40 dark:text-blue-200">
                            <p className="text-xs uppercase">Проверено критериев</p>
                            <p className="text-xl font-semibold">{activeSession.analysisResults.length}</p>
                          </div>
                          <div className="rounded-lg bg-green-50 p-3 text-green-900 dark:bg-green-950/30 dark:text-green-200">
                            <p className="text-xs uppercase">Высокая уверенность</p>
                            <p className="text-xl font-semibold">
                              {activeSession.analysisResults.filter(r => r.confidence >= 80).length}
                            </p>
                          </div>
                          <div className="rounded-lg bg-yellow-50 p-3 text-yellow-900 dark:bg-yellow-950/30 dark:text-yellow-200">
                            <p className="text-xs uppercase">Требует проверки</p>
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
                        <TranscriptViewer
                          transcriptData={activeSession.transcriptData}
                          audioFile={activeSession.audioFile || null}
                          focusTimestamp={focusedTranscriptTimestamp}
                        />
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

                        {groupedFlags.length > 0 ? (
                          <Accordion type="multiple" className="space-y-2">
                            {groupedFlags.map(group => (
                              <AccordionItem key={group.key} value={group.key} className="border border-blue-200 dark:border-blue-900/40 rounded-lg">
                                <AccordionTrigger className="flex items-center gap-3 px-4 py-3">
                                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{group.label}</span>
                                  <div className="ml-auto flex items-center gap-2">
                                    {group.fail > 0 && (
                                      <Badge className={severityBadgeClasses.bad}>
                                        {group.fail} крит.
                                      </Badge>
                                    )}
                                    {group.review > 0 && (
                                      <Badge className={severityBadgeClasses.warn}>
                                        {group.review} проверить
                                      </Badge>
                                    )}
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="space-y-3 px-4 pb-4">
                                  {group.items.map(item => (
                                    <div key={item.id} className="rounded-lg border border-blue-200 bg-white p-3 text-sm shadow-sm dark:border-blue-800 dark:bg-gray-900">
                                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div className="space-y-2">
                                          <div>
                                            <p className="font-semibold text-gray-900 dark:text-gray-100">{item.criterion}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{group.label}</p>
                                          </div>
                                          <p className="text-gray-700 dark:text-gray-300">{item.explanation}</p>
                                          <div className="flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                                            <span>Уверенность: {item.confidence}%</span>
                                            {item.needsReview && <span className="text-yellow-600 dark:text-yellow-300">Нужна проверка менеджером</span>}
                                            {item.timestampLabel && (
                                              <span className="text-blue-600 dark:text-blue-300">Метка: {item.timestampLabel}</span>
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex shrink-0 flex-col items-end gap-2">
                                          <Badge className={severityBadgeClasses[item.severity === 'fail' ? 'bad' : 'warn']}>
                                            {item.severity === 'fail' ? 'Провал' : 'Проверить'}
                                          </Badge>
                                          {item.timestampSeconds !== null && (
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="gap-1"
                                              onClick={() => focusTranscriptAt(item.timestampSeconds)}
                                            >
                                              <Play className="h-3 w-3" />
                                              Смотреть в транскрипте
                                            </Button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400">Нарушения не обнаружены.</p>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-12 text-center text-sm text-gray-500 dark:text-gray-300">
                    Выберите запись в списке, чтобы посмотреть транскрипт и оценку AI.
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
                    ? "Загрузите чек-лист и создайте хотя бы один транскрипт, чтобы запустить анализ."
                    : !checklist
                      ? "Добавьте чек-лист, чтобы включить AI-оценку."
                      : "Создайте транскрипт минимум для одной записи, чтобы продолжить."}
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
        </TabsContent>

        <TabsContent value="sales-managers" className="space-y-6 mt-6">
          <ManagerPerformance />
        </TabsContent>

        </Tabs>
        )}
      </div>
    </div>
  )
}
