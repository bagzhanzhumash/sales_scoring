"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { 
  BarChart3,
  TrendingUp,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  HelpCircle,
  Users,
  Bot,
  Clock,
  FileAudio,
  FileText,
  AlertTriangle,
  ThumbsUp,
  Activity,
  PieChart,
  TrendingDown,
  Timer
} from "lucide-react"

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

interface FileSession {
  id: string
  audioFile?: UploadedFile
  transcriptFile?: UploadedFile
  transcriptData?: TranscriptData
  analysisResults: AnalysisResult[]
  isTranscribing: boolean
  isAnalyzing: boolean
}

interface GeneralAnalyticsProps {
  sessions: FileSession[]
  checklist?: any
}

export function GeneralAnalytics({ sessions, checklist }: GeneralAnalyticsProps) {
  const analytics = useMemo(() => {
    // Basic file metrics
    const totalFiles = sessions.length
    const audioFiles = sessions.filter(s => s.audioFile).length
    const transcriptFiles = sessions.filter(s => s.transcriptFile).length
    const transcribedFiles = sessions.filter(s => s.transcriptData).length
    const analyzedFiles = sessions.filter(s => s.analysisResults.length > 0).length
    const processingFiles = sessions.filter(s => s.isTranscribing || s.isAnalyzing).length
    const failedFiles = sessions.filter(s => 
      s.audioFile?.status === 'failed' || s.transcriptFile?.status === 'failed'
    ).length

    // Processing pipeline metrics
    const pipelineCompletion = totalFiles > 0 ? (analyzedFiles / totalFiles) * 100 : 0
    const transcriptionRate = totalFiles > 0 ? (transcribedFiles / totalFiles) * 100 : 0
    const analysisRate = transcribedFiles > 0 ? (analyzedFiles / transcribedFiles) * 100 : 0

    // Analysis quality metrics
    const allAnalysisResults = sessions.flatMap(s => s.analysisResults)
    const totalCriteria = allAnalysisResults.length
    const passedCriteria = allAnalysisResults.filter(r => r.score === 1).length
    const failedCriteria = allAnalysisResults.filter(r => r.score === 0).length
    const reviewCriteria = allAnalysisResults.filter(r => r.score === "?").length
    const editedCriteria = allAnalysisResults.filter(r => r.isEdited).length
    const needsReviewCriteria = allAnalysisResults.filter(r => r.needsReview).length

    // Confidence metrics
    const avgConfidence = totalCriteria > 0 
      ? Math.round(allAnalysisResults.reduce((acc, r) => acc + r.confidence, 0) / totalCriteria)
      : 0
    const highConfidence = allAnalysisResults.filter(r => r.confidence >= 80).length
    const mediumConfidence = allAnalysisResults.filter(r => r.confidence >= 60 && r.confidence < 80).length
    const lowConfidence = allAnalysisResults.filter(r => r.confidence < 60).length

    // Transcription metrics
    const transcriptMetrics = sessions
      .filter(s => s.transcriptData)
      .map(s => s.transcriptData!)
    
    const avgTranscriptConfidence = transcriptMetrics.length > 0
      ? Math.round(transcriptMetrics.reduce((acc, t) => acc + t.confidence, 0) / transcriptMetrics.length)
      : 0
    
    const totalDuration = transcriptMetrics.reduce((acc, t) => acc + t.duration, 0)
    const totalWordCount = transcriptMetrics.reduce((acc, t) => acc + t.wordCount, 0)
    const avgProcessingTime = transcriptMetrics.length > 0
      ? Math.round(transcriptMetrics.reduce((acc, t) => acc + t.processingTime, 0) / transcriptMetrics.length)
      : 0

    // File size metrics
    const allFiles = sessions.flatMap(s => [s.audioFile, s.transcriptFile].filter(Boolean) as UploadedFile[])
    const totalFileSize = allFiles.reduce((acc, f) => acc + f.size, 0)
    const avgFileSize = allFiles.length > 0 ? totalFileSize / allFiles.length : 0

    // Quality insights
    const overallScore = totalCriteria > 0 ? Math.round((passedCriteria / totalCriteria) * 100) : 0
    const manualOverrideRate = totalCriteria > 0 ? Math.round((editedCriteria / totalCriteria) * 100) : 0
    const reviewRate = totalCriteria > 0 ? Math.round((needsReviewCriteria / totalCriteria) * 100) : 0

    // Performance scoring
    const getPerformanceScore = () => {
      let score = 0
      if (pipelineCompletion >= 80) score += 25
      else if (pipelineCompletion >= 60) score += 15
      else if (pipelineCompletion >= 40) score += 10

      if (overallScore >= 80) score += 25
      else if (overallScore >= 60) score += 15
      else if (overallScore >= 40) score += 10

      if (avgConfidence >= 80) score += 25
      else if (avgConfidence >= 60) score += 15
      else if (avgConfidence >= 40) score += 10

      if (failedFiles === 0) score += 25
      else if (failedFiles <= 2) score += 15
      else if (failedFiles <= 5) score += 10

      return Math.min(score, 100)
    }

    return {
      // File metrics
      totalFiles,
      audioFiles,
      transcriptFiles,
      transcribedFiles,
      analyzedFiles,
      processingFiles,
      failedFiles,

      // Pipeline metrics
      pipelineCompletion,
      transcriptionRate,
      analysisRate,

      // Analysis metrics
      totalCriteria,
      passedCriteria,
      failedCriteria,
      reviewCriteria,
      editedCriteria,
      needsReviewCriteria,
      overallScore,
      manualOverrideRate,
      reviewRate,

      // Confidence metrics
      avgConfidence,
      highConfidence,
      mediumConfidence,
      lowConfidence,

      // Transcription metrics
      avgTranscriptConfidence,
      totalDuration,
      totalWordCount,
      avgProcessingTime,

      // File metrics
      totalFileSize,
      avgFileSize,

      // Performance
      performanceScore: getPerformanceScore()
    }
  }, [sessions])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
      return `${hours}ч ${minutes}м ${secs}с`
    } else if (minutes > 0) {
      return `${minutes}м ${secs}с`
    } else {
      return `${secs}с`
    }
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 80) return "text-green-600"
    if (score >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  const getPerformanceBg = (score: number) => {
    if (score >= 80) return "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800"
    if (score >= 60) return "bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800"
    return "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800"
  }

  if (analytics.totalFiles === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Сводная аналитика
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Загрузите файлы, чтобы увидеть аналитику</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Общая эффективность
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className={`p-6 rounded-lg border ${getPerformanceBg(analytics.performanceScore)}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Итоговый балл эффективности</h3>
              <div className={`text-3xl font-bold ${getPerformanceColor(analytics.performanceScore)}`}>
                {analytics.performanceScore}/100
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {Math.round(analytics.pipelineCompletion)}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Пайплайн завершён</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {analytics.overallScore}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Качество</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {analytics.avgConfidence}%
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Средняя уверенность</p>
              </div>
              
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {analytics.failedFiles}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Ошибок</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* File Processing Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Ход обработки
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <FileAudio className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-blue-600">{analytics.audioFiles}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Аудио</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-600">{analytics.transcribedFiles}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Транскрибировано</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Bot className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-600">{analytics.analyzedFiles}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Анализ готов</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <Timer className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-orange-600">{analytics.processingFiles}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">В очереди</p>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Завершённый пайплайн</span>
              <span className="text-sm text-gray-500">{analytics.analyzedFiles}/{analytics.totalFiles} файлов</span>
            </div>
            <Progress value={analytics.pipelineCompletion} className="h-3" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Доля транскрибации</span>
              <span className="text-sm text-gray-500">{analytics.transcribedFiles}/{analytics.totalFiles} файлов</span>
            </div>
            <Progress value={analytics.transcriptionRate} className="h-3" />
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Доля анализа</span>
              <span className="text-sm text-gray-500">{analytics.analyzedFiles}/{analytics.transcribedFiles} файлов</span>
            </div>
            <Progress value={analytics.analysisRate} className="h-3" />
          </div>
        </CardContent>
      </Card>

      {/* Quality Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Показатели качества
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {analytics.totalCriteria > 0 ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-1" />
                    <span className="text-2xl font-bold text-green-600">{analytics.passedCriteria}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Выполнено</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <XCircle className="h-5 w-5 text-red-600 mr-1" />
                    <span className="text-2xl font-bold text-red-600">{analytics.failedCriteria}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Провалы</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <HelpCircle className="h-5 w-5 text-yellow-600 mr-1" />
                    <span className="text-2xl font-bold text-yellow-600">{analytics.reviewCriteria}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">На проверке</p>
                </div>
                
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-purple-600 mr-1" />
                    <span className="text-2xl font-bold text-purple-600">{analytics.editedCriteria}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Отредактировано</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-xl font-bold text-green-600 mb-1">{analytics.overallScore}%</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Итоговый балл</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-xl font-bold text-blue-600 mb-1">{analytics.avgConfidence}%</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Средняя уверенность</p>
                </div>
                
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-xl font-bold text-orange-600 mb-1">{analytics.reviewRate}%</div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Доля проверок</p>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Анализ ещё не выполнен</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transcription & Processing Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Метрики обработки
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-xl font-bold text-blue-600 mb-1">
                {formatDuration(analytics.totalDuration)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Суммарная длительность</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-xl font-bold text-green-600 mb-1">
                {analytics.totalWordCount.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Всего слов</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-xl font-bold text-purple-600 mb-1">
                {analytics.avgTranscriptConfidence}%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Качество транскриптов</p>
            </div>
            
            <div className="text-center p-4 border rounded-lg">
              <div className="text-xl font-bold text-orange-600 mb-1">
                {formatFileSize(analytics.totalFileSize)}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Общий размер файлов</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Health Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Состояние системы
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.failedFiles > 0 && (
              <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-red-800 dark:text-red-200">
                      {analytics.failedFiles} файлов не обработаны
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Проверьте формат и размер файлов. Попробуйте загрузить проблемные записи повторно.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {analytics.reviewRate > 20 && (
              <div className="p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <div className="flex items-start gap-3">
                  <HelpCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800 dark:text-yellow-200">
                      Высокая доля ручной проверки ({analytics.reviewRate}%)
                    </p>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      Проверьте формулировки чек-листа и качество аудио, чтобы снизить количество проверок.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {analytics.avgConfidence >= 85 && analytics.manualOverrideRate < 10 && (
              <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-start gap-3">
                  <ThumbsUp className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-800 dark:text-green-200">
                      Отличная работа AI
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                      Высокая уверенность и низкая доля ручных правок подтверждают стабильное качество анализа.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {analytics.pipelineCompletion >= 90 && (
              <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-blue-800 dark:text-blue-200">
                      Высокая скорость обработки
                    </p>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      {analytics.pipelineCompletion.toFixed(1)}% файлов прошли полный цикл обработки.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
