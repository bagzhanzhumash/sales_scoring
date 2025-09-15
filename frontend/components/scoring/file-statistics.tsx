"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { 
  FileAudio,
  FileText,
  Clock,
  Zap,
  Target,
  TrendingUp,
  Bot,
  Users,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  BarChart3,
  Play,
  Download,
  Edit,
  Eye,
  Calendar,
  HardDrive,
  Mic
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

interface FileStatisticsProps {
  session: FileSession
  checklist?: any
  onViewTranscript?: () => void
  onEditAnalysis?: () => void
  onPlayAudio?: () => void
  onDownload?: () => void
}

export function FileStatistics({ 
  session, 
  checklist,
  onViewTranscript,
  onEditAnalysis,
  onPlayAudio,
  onDownload
}: FileStatisticsProps) {
  const stats = useMemo(() => {
    const { audioFile, transcriptFile, transcriptData, analysisResults } = session

    // File info
    const fileName = audioFile?.name || transcriptFile?.name || 'Unknown File'
    const fileSize = (audioFile?.size || 0) + (transcriptFile?.size || 0)
    const uploadDate = audioFile?.uploadedAt || transcriptFile?.uploadedAt || new Date().toISOString()
    const fileType = audioFile?.type || transcriptFile?.type || 'unknown'

    // Processing status
    const hasAudio = !!audioFile
    const hasTranscript = !!transcriptData || !!transcriptFile
    const hasAnalysis = analysisResults.length > 0
    const isProcessing = session.isTranscribing || session.isAnalyzing

    // Progress calculation
    let progressPercentage = 0
    if (hasAudio) progressPercentage += 33
    if (hasTranscript) progressPercentage += 33
    if (hasAnalysis) progressPercentage += 34

    // Status determination
    let status: 'pending' | 'transcribing' | 'transcribed' | 'analyzing' | 'complete' | 'failed' = 'pending'
    if (audioFile?.status === 'failed' || transcriptFile?.status === 'failed') {
      status = 'failed'
    } else if (session.isAnalyzing) {
      status = 'analyzing'
    } else if (session.isTranscribing) {
      status = 'transcribing'
    } else if (hasAnalysis) {
      status = 'complete'
    } else if (hasTranscript) {
      status = 'transcribed'
    }

    // Transcription metrics
    const transcriptMetrics = transcriptData ? {
      confidence: transcriptData.confidence,
      duration: transcriptData.duration,
      wordCount: transcriptData.wordCount,
      processingTime: transcriptData.processingTime,
      wordsPerMinute: transcriptData.duration > 0 ? Math.round((transcriptData.wordCount / transcriptData.duration) * 60) : 0,
      segmentCount: transcriptData.segments.length,
      operatorSegments: transcriptData.segments.filter(s => s.speaker === 'Operator').length,
      clientSegments: transcriptData.segments.filter(s => s.speaker === 'Client').length,
    } : null

    // Analysis metrics
    const analysisMetrics = analysisResults.length > 0 ? {
      totalCriteria: analysisResults.length,
      passedCriteria: analysisResults.filter(r => r.score === 1).length,
      failedCriteria: analysisResults.filter(r => r.score === 0).length,
      reviewCriteria: analysisResults.filter(r => r.score === "?").length,
      editedCriteria: analysisResults.filter(r => r.isEdited).length,
      needsReviewCriteria: analysisResults.filter(r => r.needsReview).length,
      avgConfidence: Math.round(analysisResults.reduce((acc, r) => acc + r.confidence, 0) / analysisResults.length),
      highConfidence: analysisResults.filter(r => r.confidence >= 80).length,
      mediumConfidence: analysisResults.filter(r => r.confidence >= 60 && r.confidence < 80).length,
      lowConfidence: analysisResults.filter(r => r.confidence < 60).length,
      overallScore: Math.round((analysisResults.filter(r => r.score === 1).length / analysisResults.length) * 100),
    } : null

    return {
      fileName,
      fileSize,
      uploadDate,
      fileType,
      hasAudio,
      hasTranscript,
      hasAnalysis,
      isProcessing,
      progressPercentage,
      status,
      transcriptMetrics,
      analysisMetrics
    }
  }, [session])

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
      return `${hours}h ${minutes}m ${secs}s`
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`
    } else {
      return `${secs}s`
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'text-green-600'
      case 'analyzing': return 'text-blue-600'
      case 'transcribing': return 'text-yellow-600'
      case 'transcribed': return 'text-purple-600'
      case 'failed': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800'
      case 'analyzing': return 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800'
      case 'transcribing': return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800'
      case 'transcribed': return 'bg-purple-50 border-purple-200 dark:bg-purple-950 dark:border-purple-800'
      case 'failed': return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
      default: return 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800'
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 truncate">
            <BarChart3 className="h-5 w-5 flex-shrink-0" />
            <span className="truncate">{stats.fileName}</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            {onPlayAudio && stats.hasAudio && (
              <Button
                size="sm"
                variant="outline"
                onClick={onPlayAudio}
                className="flex items-center gap-1"
              >
                <Play className="h-4 w-4" />
                Play
              </Button>
            )}
            {onViewTranscript && stats.hasTranscript && (
              <Button
                size="sm"
                variant="outline"
                onClick={onViewTranscript}
                className="flex items-center gap-1"
              >
                <Eye className="h-4 w-4" />
                View
              </Button>
            )}
            {onEditAnalysis && stats.hasAnalysis && (
              <Button
                size="sm"
                variant="outline"
                onClick={onEditAnalysis}
                className="flex items-center gap-1"
              >
                <Edit className="h-4 w-4" />
                Edit
              </Button>
            )}
            {onDownload && (
              <Button
                size="sm"
                variant="outline"
                onClick={onDownload}
                className="flex items-center gap-1"
              >
                <Download className="h-4 w-4" />
                Export
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Overview */}
        <div className={`p-4 rounded-lg border ${getStatusBg(stats.status)}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">File Overview</h3>
            <Badge variant="secondary" className={getStatusColor(stats.status)}>
              {stats.status.charAt(0).toUpperCase() + stats.status.slice(1)}
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {new Date(stats.uploadDate).toLocaleDateString()}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {formatFileSize(stats.fileSize)}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {stats.fileType.split('/')[1]?.toUpperCase() || 'Unknown'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-500" />
              <span className="text-gray-600 dark:text-gray-400">
                {stats.progressPercentage}% Complete
              </span>
            </div>
          </div>

          <div className="mt-3">
            <Progress value={stats.progressPercentage} className="h-2" />
          </div>
        </div>

        {/* Processing Pipeline Status */}
        <div>
          <h3 className="font-semibold mb-3 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Processing Pipeline
          </h3>
          
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-3 border rounded-lg text-center ${stats.hasAudio ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800'}`}>
              <FileAudio className={`h-6 w-6 mx-auto mb-2 ${stats.hasAudio ? 'text-green-600' : 'text-gray-400'}`} />
              <div className="text-sm font-medium">Audio</div>
              <div className="text-xs text-gray-500">
                {stats.hasAudio ? '✓ Uploaded' : 'Pending'}
              </div>
            </div>
            
            <div className={`p-3 border rounded-lg text-center ${stats.hasTranscript ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' : stats.status === 'transcribing' ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800'}`}>
              <FileText className={`h-6 w-6 mx-auto mb-2 ${stats.hasTranscript ? 'text-green-600' : stats.status === 'transcribing' ? 'text-yellow-600' : 'text-gray-400'}`} />
              <div className="text-sm font-medium">Transcript</div>
              <div className="text-xs text-gray-500">
                {stats.hasTranscript ? '✓ Ready' : stats.status === 'transcribing' ? 'Processing...' : 'Pending'}
              </div>
            </div>
            
            <div className={`p-3 border rounded-lg text-center ${stats.hasAnalysis ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' : stats.status === 'analyzing' ? 'bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800' : 'bg-gray-50 border-gray-200 dark:bg-gray-950 dark:border-gray-800'}`}>
              <Bot className={`h-6 w-6 mx-auto mb-2 ${stats.hasAnalysis ? 'text-green-600' : stats.status === 'analyzing' ? 'text-blue-600' : 'text-gray-400'}`} />
              <div className="text-sm font-medium">Analysis</div>
              <div className="text-xs text-gray-500">
                {stats.hasAnalysis ? '✓ Complete' : stats.status === 'analyzing' ? 'Processing...' : 'Pending'}
              </div>
            </div>
          </div>
        </div>

        {/* Transcription Metrics */}
        {stats.transcriptMetrics && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Mic className="h-5 w-5" />
                Transcription Quality
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {stats.transcriptMetrics.confidence}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Confidence</p>
                </div>
                
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {formatDuration(stats.transcriptMetrics.duration)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Duration</p>
                </div>
                
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-purple-600">
                    {stats.transcriptMetrics.wordCount.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Words</p>
                </div>
                
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-orange-600">
                    {stats.transcriptMetrics.segmentCount}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Segments</p>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-600" />
                    <span className="text-sm">Operator Segments</span>
                  </div>
                  <span className="font-bold text-blue-600">{stats.transcriptMetrics.operatorSegments}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Client Segments</span>
                  </div>
                  <span className="font-bold text-green-600">{stats.transcriptMetrics.clientSegments}</span>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Analysis Results */}
        {stats.analysisMetrics && (
          <>
            <Separator />
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Target className="h-5 w-5" />
                Analysis Results
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className={`text-lg font-bold ${getScoreColor(stats.analysisMetrics.overallScore)}`}>
                    {stats.analysisMetrics.overallScore}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Overall Score</p>
                </div>
                
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-blue-600">
                    {stats.analysisMetrics.avgConfidence}%
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Confidence</p>
                </div>
                
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-green-600">
                    {stats.analysisMetrics.passedCriteria}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Passed</p>
                </div>
                
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-lg font-bold text-yellow-600">
                    {stats.analysisMetrics.needsReviewCriteria}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Need Review</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">Passed</span>
                  </div>
                  <span className="font-bold text-green-600">{stats.analysisMetrics.passedCriteria}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm">Failed</span>
                  </div>
                  <span className="font-bold text-red-600">{stats.analysisMetrics.failedCriteria}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="flex items-center gap-2">
                    <HelpCircle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm">Review</span>
                  </div>
                  <span className="font-bold text-yellow-600">{stats.analysisMetrics.reviewCriteria}</span>
                </div>
              </div>

              {stats.analysisMetrics.editedCriteria > 0 && (
                <div className="mt-4 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                  <div className="flex items-center gap-2">
                    <Edit className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
                      {stats.analysisMetrics.editedCriteria} criteria manually adjusted
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Status Messages */}
        {stats.status === 'failed' && (
          <div className="p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">Processing Failed</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  This file failed to process. Check the file format and try re-uploading.
                </p>
              </div>
            </div>
          </div>
        )}

        {stats.isProcessing && (
          <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium text-blue-800 dark:text-blue-200">
                  {stats.status === 'transcribing' ? 'Transcribing Audio...' : 'Analyzing Content...'}
                </p>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  Processing in progress. Results will appear when complete.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 