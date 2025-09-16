"use client"

import { useState, useCallback, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { FileUploadSection } from "@/components/scoring/file-upload-section"
import { ChecklistSection } from "@/components/scoring/checklist-section"  
import { AutoAnalysisSection } from "@/components/scoring/auto-analysis-section"
import { StatisticsSection } from "@/components/scoring/statistics-section"
import { GeneralAnalytics } from "@/components/scoring/general-analytics"
import { FileStatistics } from "@/components/scoring/file-statistics"
import { TranscriptViewer } from "@/components/scoring/transcript-viewer"
import { BottomControls } from "@/components/scoring/bottom-controls"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertTriangle, RefreshCw, Sparkles, MessageSquare, FileAudio, FileText, Trash2, Play, Pause, Download, BarChart3, Users, Clock, ChevronLeft, ChevronRight, Search, List, Grid, Loader2, Zap, Plus } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Checklist, Project, AudioFile, AnalysisResult } from "@/types/projects"
import * as scoringAPI from "@/lib/api/scoring"

interface FileSession {
  id: string
  projectId?: string
  audioFile?: File
  audioFileId?: string
  transcriptionId?: string
  transcriptData?: any
  analysisResults: any[]
  isTranscribing: boolean
  isAnalyzing: boolean
  uploadedAt: string
  status: "pending" | "uploading" | "uploaded" | "transcribing" | "transcribed" | "analyzing" | "analyzed" | "failed"
  progress?: number
  error?: string
}

interface BatchProgress {
  stage: 'upload' | 'transcription' | 'analysis' | 'complete'
  current: number
  total: number
  currentFile?: string
}

const statusLabels: Record<FileSession["status"], string> = {
  pending: "В ожидании",
  uploading: "Загрузка",
  uploaded: "Загружено",
  transcribing: "Транскрибация",
  transcribed: "С транскриптом",
  analyzing: "Анализ",
  analyzed: "Проанализировано",
  failed: "Ошибка"
}

export default function ScoringPage() {
  const router = useRouter()
  const { toast } = useToast()

  // State management
  const [currentProject, setCurrentProject] = useState<Project | null>(null)
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [fileSessions, setFileSessions] = useState<FileSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [selectedSessions, setSelectedSessions] = useState<Set<string>>(new Set())
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [batchProgress, setBatchProgress] = useState<BatchProgress | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Pagination and filtering
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(20)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"date" | "name" | "status" | "progress">("date")
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  // Initialize project on component mount
  useEffect(() => {
    initializeProject()
  }, [])

  const initializeProject = async () => {
    try {
      const projectName = `Scoring Session ${new Date().toLocaleDateString()}`
      const project = await scoringAPI.createProject(projectName, "Real-time scoring session")
      setCurrentProject(project)
      
      toast({
        title: "Проект создан",
        description: `Создан проект: ${project.name}`
      })
    } catch (error) {
      console.error("Failed to create project:", error)
      toast({
        title: "Ошибка",
        description: "Не удалось создать проект",
        variant: "destructive"
      })
    }
  }

  const fetchProjectFilesAndTranscriptions = useCallback(async (projectId: string) => {
    // Fetch audio files and their transcriptions from the backend
    try {
      const filesResponse = await scoringAPI.getProjectFiles(projectId)
      // filesResponse should include audio files and their linked transcriptions
      setFileSessions(filesResponse.files.map((file: any) => ({
        id: file.id,
        projectId: file.project_id,
        audioFile: {
          name: file.filename,
          size: file.file_size_bytes,
          type: file.mime_type || 'audio/mpeg',
          file: undefined // Not available, but can be used for download if needed
        },
        audioFileId: file.id,
        transcriptionId: file.transcription?.id,
        transcriptData: file.transcription ? {
          text: file.transcription.text,
          wordCount: file.transcription.word_count,
          duration: file.transcription.duration_seconds,
          confidence: file.transcription.confidence,
          language: file.transcription.language,
          processingTime: file.transcription.processing_time_seconds
        } : null,
        analysisResults: file.transcription?.analysis ? [file.transcription.analysis] : [],
        isTranscribing: false,
        isAnalyzing: false,
        uploadedAt: file.uploaded_at,
        status: file.status,
        progress: 100,
        error: undefined
      })))
    } catch (error) {
      toast({
        title: "Не удалось получить файлы",
        description: error instanceof Error ? error.message : String(error),
        variant: "destructive"
      })
    }
  }, [toast])

  // Call fetchProjectFilesAndTranscriptions after project creation and after transcript upload
  useEffect(() => {
    if (currentProject?.id) fetchProjectFilesAndTranscriptions(currentProject.id)
  }, [currentProject?.id])

  // File upload handlers
  const handleAudioUpload = useCallback(async (files: File | File[]) => {
    if (!currentProject) {
      toast({
        title: "Нет проекта",
        description: "Подождите завершения инициализации проекта",
        variant: "destructive"
      })
      return
    }

    const fileArray = Array.isArray(files) ? files : [files]
    
    // Create file sessions immediately
    const newSessions = fileArray.map(file => ({
      id: `session-${Date.now()}-${Math.random()}`,
      projectId: currentProject.id,
      audioFile: file,
      transcriptData: null,
      analysisResults: [],
      isTranscribing: false,
      isAnalyzing: false,
      uploadedAt: new Date().toISOString(),
      status: "uploading" as const,
      progress: 0
    }))

    setFileSessions(prev => [...prev, ...newSessions])
    
    if (newSessions.length === 1) {
      setActiveSessionId(newSessions[0].id)
    }

    // Upload files to backend
    try {
      setBatchProgress({
        stage: 'upload',
        current: 0,
        total: fileArray.length
      })

      for (let i = 0; i < fileArray.length; i++) {
        const file = fileArray[i]
        const sessionId = newSessions[i].id

        setBatchProgress(prev => prev ? {
          ...prev,
          current: i + 1,
          currentFile: file.name
        } : null)

        try {
          const uploadResult = await scoringAPI.uploadAudioFile(currentProject.id, file)
          
          setFileSessions(prev => prev.map(session => 
            session.id === sessionId 
              ? { 
                  ...session, 
                  audioFileId: uploadResult.id,
                  status: "uploaded" as const,
                  progress: 100
                }
              : session
          ))
                 } catch (error) {
           setFileSessions(prev => prev.map(session => 
             session.id === sessionId 
               ? { 
                   ...session, 
                   status: "failed" as const,
                   error: `Ошибка загрузки: ${error instanceof Error ? error.message : 'Неизвестная ошибка'}`
                 }
               : session
           ))
         }
      }

      setBatchProgress(null)
      
      toast({
        title: "Загрузка завершена",
        description: `${fileArray.length} файл(ов) успешно загружено`
      })
    } catch (error) {
      setBatchProgress(null)
      toast({
        title: "Ошибка загрузки",
        description: "Произошла ошибка при загрузке файлов",
        variant: "destructive"
      })
    }
  }, [currentProject, toast])

  // Transcription handlers
  const handleRunTranscription = useCallback(async (sessionId: string) => {
    const session = fileSessions.find(s => s.id === sessionId)
    if (!session?.audioFileId) {
      toast({
        title: "Нет аудио файла",
        description: "Сначала загрузите аудиозапись",
        variant: "destructive"
      })
      return
    }

    setFileSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, isTranscribing: true, status: "transcribing" }
        : session
    ))

    try {
      const transcriptionResult = await scoringAPI.createTranscription({
        audio_file_id: session.audioFileId,
        language: "ru",
        model_version: "whisper-1"
      })

      // Poll for completion
      const pollInterval = setInterval(async () => {
        try {
          const transcription = await scoringAPI.getTranscription(transcriptionResult.id)
          
          if (transcription.status === "completed") {
            clearInterval(pollInterval)
            
            setFileSessions(prev => prev.map(s => 
              s.id === sessionId 
                ? { 
                    ...s, 
                    isTranscribing: false,
                    transcriptionId: transcription.id,
                    transcriptData: {
                      text: transcription.text,
                      wordCount: transcription.word_count,
                      duration: transcription.duration_seconds,
                      confidence: transcription.confidence,
                      language: transcription.language,
                      processingTime: transcription.processing_time_seconds
                    },
                    status: "transcribed"
                  }
                : s
            ))

            toast({
              title: "Транскрипция завершена",
              description: "Аудио успешно преобразовано в текст"
            })
          } else if (transcription.status === "failed") {
            clearInterval(pollInterval)
            throw new Error("Transcription failed")
          }
        } catch (error) {
          clearInterval(pollInterval)
          throw error
        }
      }, 2000)

         } catch (error) {
       setFileSessions(prev => prev.map(session => 
         session.id === sessionId 
           ? { ...session, isTranscribing: false, status: "failed", error: error instanceof Error ? error.message : 'Неизвестная ошибка' }
           : session
       ))
       
       toast({
         title: "Ошибка транскрибации", 
         description: "Не удалось получить транскрипт",
         variant: "destructive"
       })
     }
  }, [fileSessions, toast])

  // Analysis handlers
  const handleAnalyzeFile = useCallback(async (sessionId: string) => {
    if (!checklist) {
      toast({
        title: "Нет чек-листа",
        description: "Сначала загрузите чек-лист",
        variant: "destructive"
      })
      return
    }

    const session = fileSessions.find(s => s.id === sessionId)
    if (!session?.transcriptionId) {
      toast({
        title: "Нет транскрипта",
        description: "Сначала выполните транскрибацию файла",
        variant: "destructive"
      })
      return
    }

    setFileSessions(prev => prev.map(session => 
      session.id === sessionId 
        ? { ...session, isAnalyzing: true, status: "analyzing" }
        : session
    ))

    try {
      const analysisResult = await scoringAPI.analyzeTranscription(
        session.transcriptionId, 
        checklist.id, 
        true // background processing
      )

      if (analysisResult.type === "background_task") {
        // Poll for completion
        const pollInterval = setInterval(async () => {
          try {
                         const status = await scoringAPI.getAnalysisStatus(session.transcriptionId!)
            
            if (status.status === "completed") {
              clearInterval(pollInterval)
              
              setFileSessions(prev => prev.map(s => 
                s.id === sessionId 
                  ? { 
                      ...s, 
                      isAnalyzing: false,
                      analysisResults: status.analysis.category_results || [],
                      status: "analyzed"
                    }
                  : s
              ))

              toast({
                title: "Анализ завершён",
                description: "Файл успешно проанализирован"
              })
            } else if (status.status === "failed") {
              clearInterval(pollInterval)
              throw new Error("Analysis failed")
            }
          } catch (error) {
            clearInterval(pollInterval)
            throw error
          }
        }, 3000)
      }

         } catch (error) {
       setFileSessions(prev => prev.map(session => 
         session.id === sessionId 
           ? { ...session, isAnalyzing: false, status: "failed", error: error instanceof Error ? error.message : 'Неизвестная ошибка' }
           : session
       ))
       
       toast({
         title: "Ошибка анализа", 
         description: "Не удалось выполнить анализ",
         variant: "destructive"
       })
     }
  }, [checklist, fileSessions, toast])

  // Batch operations
  const handleBatchAnalysis = useCallback(async () => {
    if (!checklist) {
      toast({
        title: "Нет чек-листа",
        description: "Сначала загрузите чек-лист",
        variant: "destructive"
      })
      return
    }
    if (selectedSessions.size === 0) {
      toast({
        title: "Не выбраны файлы",
        description: "Выберите хотя бы один файл для анализа",
        variant: "destructive"
      })
      return
    }
    if (!currentProject) return

    // Collect transcriptionIds from selected sessions
    const transcriptionIds = Array.from(selectedSessions)
      .map(id => fileSessions.find(s => s.id === id)?.transcriptionId)
      .filter((id): id is string => Boolean(id))

    if (transcriptionIds.length === 0) {
      toast({
        title: "Нет транскриптов",
        description: "Сначала выполните транскрибацию файлов",
        variant: "destructive"
      })
      return
    }

    setBatchProgress({
      stage: 'analysis',
      current: 0,
      total: transcriptionIds.length
    })

    try {
      console.log('Calling batchAnalyze with:', { projectId: currentProject.id, checklistId: checklist.id, transcriptionIds })
      const batchResult = await scoringAPI.batchAnalyze(currentProject.id, checklist.id, transcriptionIds)
      
      // Monitor batch progress
      const pollInterval = setInterval(async () => {
        try {
          const taskStatus = await scoringAPI.getTaskStatus(batchResult.task_id)
          
          setBatchProgress(prev => prev ? {
            ...prev,
            current: taskStatus.completed_items || 0
          } : null)

          if (taskStatus.status === "completed") {
            clearInterval(pollInterval)
            setBatchProgress(null)
            setSelectedSessions(new Set())
            
            // Refresh project results
            const results = await scoringAPI.getProjectResults(currentProject.id)
            // Update file sessions with results
            // ... implementation details
            
            toast({
              title: "Пакетный анализ завершён",
              description: `Успешно проанализировано файлов: ${transcriptionIds.length}`
            })
          } else if (taskStatus.status === "failed") {
            clearInterval(pollInterval)
            setBatchProgress(null)
            throw new Error("Batch analysis failed")
          }
        } catch (error) {
          clearInterval(pollInterval)
          setBatchProgress(null)
          throw error
        }
      }, 5000)

    } catch (error) {
      setBatchProgress(null)
      toast({
        title: "Ошибка пакетного анализа",
        description: "Не удалось выполнить пакетный анализ",
        variant: "destructive"
      })
    }
  }, [checklist, selectedSessions, currentProject, toast])

  // Selection handlers
  const handleSelectSession = useCallback((sessionId: string) => {
    setSelectedSessions(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId)
      } else {
        newSet.add(sessionId)
      }
      return newSet
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    const allIds = fileSessions.map(s => s.id)
    setSelectedSessions(new Set(allIds))
  }, [fileSessions])

  // Checklist upload handler
  const handleChecklistUpload = useCallback(async (checklistData: Checklist) => {
    try {
      const uploadedChecklist = await scoringAPI.uploadChecklist(checklistData)
      setChecklist(uploadedChecklist)
      
      toast({
        title: "Чек-лист загружен",
        description: `Чек-лист «${uploadedChecklist.name}» успешно добавлен`
      })
    } catch (error) {
      toast({
        title: "Ошибка при загрузке чек-листа",
        description: "Не удалось загрузить чек-лист",
        variant: "destructive"
      })
    }
  }, [toast])

  // Filtering and pagination
  const filteredSessions = useMemo(() => {
    return fileSessions.filter(session => {
      if (searchTerm && !session.audioFile?.name.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }
      
      if (statusFilter === "transcribed" && session.status !== "transcribed" && session.status !== "analyzed") return false
      if (statusFilter === "analyzed" && session.status !== "analyzed") return false
      if (statusFilter === "pending" && (session.status === "transcribed" || session.status === "analyzed")) return false
      
      return true
    })
  }, [fileSessions, searchTerm, statusFilter])

  const paginatedSessions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredSessions.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredSessions, currentPage, itemsPerPage])

  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage)

  // Get active session
  const activeSession = fileSessions.find(session => session.id === activeSessionId)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="mx-auto w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 py-6">
          <h1 className="text-3xl font-bold">Платформа оценки разговоров</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Загружайте аудио, запускайте ИИ-анализ и проверяйте результаты
          </p>
          {currentProject && (
            <Badge variant="outline" className="mt-2">
              Проект: {currentProject.name}
            </Badge>
          )}
        </div>

        {/* Project Creation */}
        {!currentProject && (
          <Card>
            <CardContent className="p-6 text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Инициализация проекта...</p>
            </CardContent>
          </Card>
        )}

        {/* Main Content */}
        {currentProject && (
          <Tabs defaultValue="upload" className="w-full">
            <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
              <TabsTrigger value="upload">Загрузка и настройка</TabsTrigger>
              <TabsTrigger value="files">Файлы и анализ</TabsTrigger>
              <TabsTrigger value="analytics">Аналитика</TabsTrigger>
              <TabsTrigger value="individual">Индивидуальный разбор</TabsTrigger>
            </TabsList>

            {/* Upload & Setup Tab */}
            <TabsContent value="upload" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <FileUploadSection
                  audioFile={null}
                  onAudioUpload={handleAudioUpload}
                  onTranscribe={() => {}}
                  isTranscribing={false}
                  supportMultiple={true}
                />
                
                <ChecklistSection
                  checklist={checklist}
                  onChecklistUpload={handleChecklistUpload}
                />
              </div>

              {/* Quick Stats */}
              {fileSessions.length > 0 && (
                <Card>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{fileSessions.length}</div>
                        <div className="text-sm text-gray-500">Всего файлов</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {fileSessions.filter(s => s.status === "uploaded").length}
                        </div>
                        <div className="text-sm text-gray-500">Загружено</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {fileSessions.filter(s => s.status === "transcribed" || s.status === "analyzed").length}
                        </div>
                        <div className="text-sm text-gray-500">С транскриптом</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {fileSessions.filter(s => s.status === "analyzed").length}
                        </div>
                        <div className="text-sm text-gray-500">Проанализировано</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold">
                          {fileSessions.filter(s => s.isTranscribing || s.isAnalyzing).length}
                        </div>
                        <div className="text-sm text-gray-500">В обработке</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Files & Analysis Tab */}
            <TabsContent value="files" className="space-y-6">
              {fileSessions.length > 0 ? (
                <>
                  {/* Controls */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Input
                            placeholder="Поиск файлов..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-64"
                          />
                          
                          <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-40">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">Все файлы</SelectItem>
                              <SelectItem value="pending">В ожидании</SelectItem>
                              <SelectItem value="transcribed">С текстом</SelectItem>
                              <SelectItem value="analyzed">Проанализировано</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSelectAll}
                          >
                            Выбрать все
                          </Button>
                          
                          {selectedSessions.size > 0 && (
                            <Button
                              onClick={handleBatchAnalysis}
                              disabled={!checklist || batchProgress !== null || selectedSessions.size === 0}
                              className="bg-blue-600 hover:bg-blue-700"
                            >
                              {batchProgress ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Анализ ({batchProgress.current}/{batchProgress.total})
                                </>
                              ) : (
                                <>
                                  <Zap className="h-4 w-4 mr-2" />
                                  Пакетный анализ ({selectedSessions.size})
                                </>
                              )}
                            </Button>
                          )}
                        </div>
                      </div>

                      {batchProgress && batchProgress.stage === 'analysis' && (
                        <div className="mt-4 space-y-2">
                          <div className="flex justify-between text-sm font-medium">
                            <span>Прогресс пакетного анализа</span>
                            <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                          </div>
                          <Progress value={(batchProgress.current / batchProgress.total) * 100} />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>Анализ {batchProgress.current} из {batchProgress.total} файлов</span>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* Files List */}
                  <Card>
                    <CardContent className="p-6">
                      <div className="space-y-4">
                        {paginatedSessions.map((session) => (
                          <div
                            key={session.id}
                            className={`p-4 border rounded-lg transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                              activeSessionId === session.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <Checkbox
                                  checked={selectedSessions.has(session.id)}
                                  onCheckedChange={() => handleSelectSession(session.id)}
                                />
                                
                                <div className="flex items-center gap-3">
                                  <FileAudio className="h-5 w-5 text-blue-600" />
                                  <div>
                                    <div className="font-medium">
                                      {session.audioFile?.name || "Аудио не загружено"}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {session.audioFile && `${(session.audioFile.size / 1024 / 1024).toFixed(1)} МБ`}
                                      {session.error && ` • ${session.error}`}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                <div className="flex gap-1">
                                  <Badge variant={session.status === "uploaded" || session.status === "transcribed" || session.status === "analyzed" ? "default" : session.status === "failed" ? "destructive" : "secondary"}>
                                    {statusLabels[session.status]}
                                  </Badge>
                                  {session.progress !== undefined && session.progress < 100 && (
                                    <Badge variant="outline">
                                      {session.progress}%
                                    </Badge>
                                  )}
                                </div>

                                <div className="flex gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleRunTranscription(session.id)}
                                    disabled={!session.audioFileId || session.isTranscribing || session.status === "transcribed" || session.status === "analyzed"}
                                  >
                                    {session.isTranscribing ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <FileText className="h-4 w-4" />
                                    )}
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleAnalyzeFile(session.id)}
                                    disabled={!session.transcriptionId || !checklist || session.isAnalyzing || session.status === "analyzed"}
                                  >
                                    {session.isAnalyzing ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Sparkles className="h-4 w-4" />
                                    )}
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setActiveSessionId(session.id)}
                                  >
                                    Открыть
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6">
                          <div className="text-sm text-gray-500">
                            Показаны записи {((currentPage - 1) * itemsPerPage) + 1}–{Math.min(currentPage * itemsPerPage, filteredSessions.length)} из {filteredSessions.length}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                              disabled={currentPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="px-3 py-2 text-sm">
                              Страница {currentPage} из {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                              disabled={currentPage === totalPages}
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </>
              ) : (
               <Card>
                 <CardContent className="p-8 text-center">
                   <FileAudio className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Файлы ещё не загружены. Перейдите во вкладку «Загрузка и настройка», чтобы начать.</p>
                 </CardContent>
               </Card>
             )}
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics">
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Аналитика будет доступна после обработки файлов</p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Individual Review Tab */}
            <TabsContent value="individual" className="space-y-6">
              {activeSession ? (
                <div className="space-y-6 min-w-0">
                  {activeSession.transcriptData && (
                    <TranscriptViewer
                      transcriptData={{
                        text: activeSession.transcriptData.text,
                        segments: []
                      }}
                      audioFile={activeSession.audioFile ? {
                        file: activeSession.audioFile,
                        name: activeSession.audioFile.name,
                        size: activeSession.audioFile.size,
                        type: activeSession.audioFile.type
                      } : null}
                    />
                  )}
                  
                  {activeSession.analysisResults.length > 0 && checklist && (
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
                      <div className="min-w-0">
                        <AutoAnalysisSection
                          checklist={checklist}
                          analysisResults={activeSession.analysisResults}
                          isAnalyzing={activeSession.isAnalyzing}
                          onAnalyze={() => handleAnalyzeFile(activeSession.id)}
                          onScoreUpdate={() => {}}
                        />
                      </div>
                      
                      <div className="min-w-0">
                        <StatisticsSection
                          analysisResults={activeSession.analysisResults}
                          checklist={checklist}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Выберите файл во вкладке «Файлы и анализ», чтобы увидеть индивидуальный разбор</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  )
} 
