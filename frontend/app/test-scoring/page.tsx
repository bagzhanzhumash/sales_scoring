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

import { useState, useCallback, useMemo, useEffect } from "react"
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
import { AlertTriangle, RefreshCw, Sparkles, MessageSquare, FileAudio, FileText, Trash2, Play, Pause, Download, BarChart3, Users, Clock, ChevronLeft, ChevronRight, Search, List, Grid, Loader2, Zap } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { Checklist } from "@/types/projects"

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

interface FileSession {
  id: string
  audioFile?: UploadedFile
  transcriptFile?: UploadedFile
  transcriptData?: TranscriptData
  analysisResults: AnalysisResult[]
  isTranscribing: boolean
  isAnalyzing: boolean
}

export default function TestScoringPage() {
  const { toast } = useToast()
  
  // File management state
  const [fileSessions, setFileSessions] = useState<FileSession[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
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
  
  // Global state
  const [globalProgress, setGlobalProgress] = useState(0)

  // Load sessionId from URL or localStorage, persist changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const fromUrl = params.get("sessionId")
    const fromStorage = localStorage.getItem("scoring.sessionId")
    const id = fromUrl || fromStorage
    if (id) {
      setSessionId(id)
      localStorage.setItem("scoring.sessionId", id)
    }
  }, [])

  useEffect(() => {
    if (sessionId) {
      localStorage.setItem("scoring.sessionId", sessionId)
    }
  }, [sessionId])

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
  }, [fileSessions, searchQuery, filterStatus, sortBy])

  // Pagination
  const totalPages = Math.ceil(filteredSessions.length / itemsPerPage)
  const paginatedSessions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return filteredSessions.slice(startIndex, startIndex + itemsPerPage)
  }, [filteredSessions, currentPage, itemsPerPage])

  // Get active session
  const activeSession = fileSessions.find(session => session.id === activeSessionId)
  
  // Check if we can proceed with analysis
  const canAnalyze = checklist && fileSessions.some(session => session.transcriptData)
  const hasAnyResults = fileSessions.some(session => session.analysisResults.length > 0)

  // Get global statistics
  const globalStats = {
    totalFiles: fileSessions.length,
    transcribedFiles: fileSessions.filter(session => session.transcriptData).length,
    analyzedFiles: fileSessions.filter(session => session.analysisResults.length > 0).length,
    processingFiles: fileSessions.filter(session => session.isTranscribing || session.isAnalyzing).length
  }

  // Mock transcript generation
  const generateMockTranscript = useCallback(async (fileId: string, fileName: string): Promise<TranscriptData> => {
    const conversations = [
      [
        {
          speaker: "Operator" as const,
          text: "Good morning, thank you for calling Premium Auto Sales. My name is Alexander, I'm a sales consultant. How can I help you today?",
          timestamp: "00:00",
          startTime: 0,
          endTime: 6
        },
        {
          speaker: "Client" as const,
          text: "Hi Alexander! I'm interested in purchasing a sedan, something reliable for daily commuting. My budget is around 25,000 dollars.",
          timestamp: "00:06",
          startTime: 6,
          endTime: 14
        },
        {
          speaker: "Operator" as const,
          text: "Excellent choice! I'd be happy to help you find the perfect sedan. Could you tell me a bit more about your requirements? How many family members, preferred brand, or any specific features?",
          timestamp: "00:14",
          startTime: 14,
          endTime: 25
        },
        {
          speaker: "Client" as const,
          text: "It's for me and my spouse, so 4-5 seats are fine. I prefer Japanese brands like Toyota or Honda. Good fuel efficiency is important, and maybe some safety features.",
          timestamp: "00:25",
          startTime: 25,
          endTime: 36
        },
        {
          speaker: "Operator" as const,
          text: "Perfect! Based on your requirements, I can recommend the Toyota Camry 2023 or Honda Accord 2023. Both have excellent fuel efficiency, top safety ratings, and are within your budget. Would you like to schedule a test drive?",
          timestamp: "00:36",
          startTime: 36,
          endTime: 50
        }
      ],
      [
        {
          speaker: "Operator" as const,
          text: "Hello, thank you for calling TechSupport Plus. My name is Maria, and I'll be assisting you today. What seems to be the issue?",
          timestamp: "00:00",
          startTime: 0,
          endTime: 7
        },
        {
          speaker: "Client" as const,
          text: "Hi Maria, I'm having trouble with my laptop. It keeps freezing, especially when I try to open multiple applications. It's really frustrating because I work from home.",
          timestamp: "00:07",
          startTime: 7,
          endTime: 18
        },
        {
          speaker: "Operator" as const,
          text: "I understand how frustrating that must be, especially when you're working from home. Let me help you troubleshoot this. First, can you tell me what operating system you're using and when this issue started?",
          timestamp: "00:18",
          startTime: 18,
          endTime: 30
        },
        {
          speaker: "Client" as const,
          text: "I'm using Windows 11. The freezing started about a week ago. Before that, everything was working fine. I haven't installed any new software recently.",
          timestamp: "00:30",
          startTime: 30,
          endTime: 40
        },
        {
          speaker: "Operator" as const,
          text: "Thank you for that information. It sounds like it could be a memory or storage issue. Let's start by checking your available disk space and running a system diagnostic. I'll guide you through each step.",
          timestamp: "00:40",
          startTime: 40,
          endTime: 52
        }
      ]
    ]

    const selectedConversation = conversations[Math.floor(Math.random() * conversations.length)]
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000))
    
    const segments = selectedConversation.map((item, index) => ({
      id: `${fileId}-segment-${index}`,
      ...item
    }))

    const fullText = segments.map(s => `${s.speaker}: ${s.text}`).join('\n')
    
    return {
      fileId,
      text: fullText,
      segments,
      confidence: 0.87 + Math.random() * 0.12, // 87-99%
      language: "ru",
      duration: segments[segments.length - 1].endTime,
      wordCount: fullText.split(' ').length,
      processingTime: 15.3 + Math.random() * 10
    }
  }, [])

  // Mock analysis generation
  const generateMockAnalysis = useCallback(async (fileId: string, checklist: Checklist): Promise<AnalysisResult[]> => {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000))
    
    const results: AnalysisResult[] = []
    
    checklist.categories.forEach(category => {
      category.criteria.forEach(criterion => {
        // Generate realistic mock scores and confidence
        const randomScore = Math.random()
        let score: 0 | 1 | "?" 
        let confidence: number
        let needsReview = false
        
        if (randomScore > 0.7) {
          score = 1
          confidence = Math.floor(85 + Math.random() * 15) // 85-100%
        } else if (randomScore > 0.3) {
          score = 0  
          confidence = Math.floor(70 + Math.random() * 20) // 70-90%
        } else {
          score = "?"
          confidence = Math.floor(40 + Math.random() * 30) // 40-70%
          needsReview = true
        }

        const explanations = {
          1: [
            "The operator clearly demonstrated this behavior throughout the conversation.",
            "Evidence of this criterion was present in multiple parts of the interaction.",
            "The conversation shows strong adherence to this requirement."
          ],
          0: [
            "This criterion was not met during the conversation.",
            "The operator missed an opportunity to demonstrate this behavior.", 
            "No clear evidence of this requirement was found in the transcript."
          ],
          "?": [
            "The evidence for this criterion is unclear or ambiguous.",
            "More context would be needed to properly evaluate this behavior.",
            "The conversation doesn't provide sufficient information to make a determination."
          ]
        }

        results.push({
          fileId,
          criterionId: criterion.id || `${category.id}-${category.criteria.indexOf(criterion)}`,
          categoryId: category.id || category.name.toLowerCase(),
          score,
          confidence,
          explanation: explanations[score][Math.floor(Math.random() * explanations[score].length)],
          needsReview,
          isEdited: false
        })
      })
    })
    
    return results
  }, [])

  // Create new file session
  const createFileSession = useCallback((): FileSession => {
    return {
      id: `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      analysisResults: [],
      isTranscribing: false,
      isAnalyzing: false
    }
  }, [])

  // Helper function to get file name without extension
  const getFileNameWithoutExtension = useCallback((fileName: string) => {
    return fileName.replace(/\.[^/.]+$/, "")
  }, [])

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
  }, [fileSessions, getFileNameWithoutExtension])

  // Handle batch upload of audio and transcript files together
  const handleBatchUpload = useCallback((audioFiles: File[], transcriptFiles: File[]) => {
    const newSessions: FileSession[] = []
    const matchedPairs: Array<{audio: File, transcript?: File}> = []
    
    // Create pairs based on filename matching
    audioFiles.forEach(audioFile => {
      const audioNameWithoutExt = getFileNameWithoutExtension(audioFile.name)
      const matchingTranscript = transcriptFiles.find(transcriptFile => {
        const transcriptNameWithoutExt = getFileNameWithoutExtension(transcriptFile.name)
        return audioNameWithoutExt === transcriptNameWithoutExt
      })
      
      matchedPairs.push({
        audio: audioFile,
        transcript: matchingTranscript
      })
    })

    // Process each pair
    matchedPairs.forEach(pair => {
      // Check if audio file already exists
      const existingSession = findExistingSessionByFileName(pair.audio.name)
      if (existingSession) {
        return // Skip duplicates
      }

      const session = createFileSession()
      
      // Create audio file
      const audioUploadedFile: UploadedFile = {
        id: `audio-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file: pair.audio,
        name: pair.audio.name,
        size: pair.audio.size,
        type: pair.audio.type,
        uploadedAt: new Date().toISOString(),
        status: "completed",
        progress: 100
      }

      let sessionData: FileSession = {
        ...session,
        audioFile: audioUploadedFile
      }

      // If transcript exists, add it too
      if (pair.transcript) {
        const transcriptUploadedFile: UploadedFile = {
          id: `transcript-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          file: pair.transcript,
          name: pair.transcript.name,
          size: pair.transcript.size,
          type: pair.transcript.type,
          uploadedAt: new Date().toISOString(),
          status: "completed",
          progress: 100
        }

        sessionData = {
          ...sessionData,
          transcriptFile: transcriptUploadedFile
        }

        // Parse transcript file immediately
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string
            
            const transcriptData: TranscriptData = {
              fileId: session.id,
              text: content,
              segments: content.split('\n')
                .filter(line => line.trim())
                .map((line, index) => ({
                  id: `${session.id}-segment-${index}`,
                  speaker: index % 2 === 0 ? "Operator" : "Client",
                  text: line.trim(),
                  timestamp: `${Math.floor(index * 30 / 60)}:${(index * 30 % 60).toString().padStart(2, '0')}`,
                  startTime: index * 30,
                  endTime: (index + 1) * 30
                })),
              confidence: 0.90,
              language: "ru",
              duration: content.split('\n').length * 30,
              wordCount: content.split(' ').length,
              processingTime: 5.2
            }
            
            setFileSessions(prev => prev.map(s => 
              s.id === session.id ? { ...s, transcriptData } : s
            ))
          } catch (error) {
            console.error('Failed to parse transcript:', error)
          }
        }
        reader.readAsText(pair.transcript)
      }

      newSessions.push(sessionData)
    })

    if (newSessions.length > 0) {
      setFileSessions(prev => [...prev, ...newSessions])
      setActiveSessionId(newSessions[0].id)
      
      const matchedCount = newSessions.filter(s => s.transcriptFile).length
      
      toast({
        title: "Batch upload complete",
        description: `${newSessions.length} audio files uploaded, ${matchedCount} matched with transcripts`
      })
    }
  }, [createFileSession, findExistingSessionByFileName, getFileNameWithoutExtension, toast])

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
  }, [createFileSession, findExistingSessionByFileName, toast])

  // Handle transcript upload with automatic filename matching
  const handleTranscriptUpload = useCallback((files: File | File[]) => {
    const filesToProcess = Array.isArray(files) ? files : [files]
    const processedFiles: string[] = []
    const matchedFiles: string[] = []
    const unMatchedFiles: string[] = []

    filesToProcess.forEach(file => {
      const transcriptNameWithoutExt = getFileNameWithoutExtension(file.name)
      
      // Find matching audio file by filename
      const matchingSession = fileSessions.find(session => {
        if (session.audioFile) {
          const audioNameWithoutExt = getFileNameWithoutExtension(session.audioFile.name)
          return audioNameWithoutExt === transcriptNameWithoutExt
        }
        return false
      })

      let targetSessionId = activeSessionId

      // If we found a matching session, use that instead
      if (matchingSession) {
        targetSessionId = matchingSession.id
        matchedFiles.push(`${file.name} ↔ ${matchingSession.audioFile?.name}`)
      } else if (!activeSession && filesToProcess.length === 1) {
        // For single file uploads, show error if no session
        toast({
          title: "No target session",
          description: "Please upload an audio file first or select an active session",
          variant: "destructive"
        })
        return
      } else if (!matchingSession) {
        unMatchedFiles.push(file.name)
        // For multiple files, create a new session if no match found
        const newSession = createFileSession()
        targetSessionId = newSession.id
        
        setFileSessions(prev => [...prev, newSession])
      }

      const uploadedFile: UploadedFile = {
        id: `transcript-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        uploadedAt: new Date().toISOString(),
        status: "completed",
        progress: 100
      }
      
      setFileSessions(prev => prev.map(session => {
        if (session.id === targetSessionId) {
          return { ...session, transcriptFile: uploadedFile }
        }
        return session
      }))
      
      // Parse transcript file
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          
          // Try to parse as JSON first
          try {
            const jsonData = JSON.parse(content)
            const transcriptData: TranscriptData = {
              fileId: targetSessionId!,
              text: jsonData.text || content,
              segments: jsonData.segments || [],
              confidence: jsonData.confidence || 0.95,
              language: jsonData.language || "ru",
              duration: jsonData.duration || 180,
              wordCount: (jsonData.text || content).split(' ').length,
              processingTime: jsonData.processingTime || 12.5
            }
            
            setFileSessions(prev => prev.map(session => {
              if (session.id === targetSessionId) {
                return { ...session, transcriptData }
              }
              return session
            }))
          } catch {
            // Fallback to plain text
            const mockSegments: TranscriptSegment[] = content.split('\n')
              .filter(line => line.trim())
              .map((line, index) => ({
                id: `${targetSessionId}-segment-${index}`,
                speaker: index % 2 === 0 ? "Operator" : "Client",
                text: line.trim(),
                timestamp: `${Math.floor(index * 30 / 60)}:${(index * 30 % 60).toString().padStart(2, '0')}`,
                startTime: index * 30,
                endTime: (index + 1) * 30
              }))
            
            const transcriptData: TranscriptData = {
              fileId: targetSessionId!,
              text: content,
              segments: mockSegments,
              confidence: 0.90,
              language: "ru", 
              duration: mockSegments.length * 30,
              wordCount: content.split(' ').length,
              processingTime: 8.2
            }
            
            setFileSessions(prev => prev.map(session => {
              if (session.id === targetSessionId) {
                return { ...session, transcriptData }
              }
              return session
            }))
          }
        } catch (error) {
          toast({
            title: "Error processing transcript",
            description: `Failed to process ${file.name}`,
            variant: "destructive"
          })
        }
      }
      reader.readAsText(file)
      
      processedFiles.push(file.name)
    })

    // Show success messages
    if (processedFiles.length > 0) {
      toast({
        title: "Transcript files uploaded",
        description: `${processedFiles.length} transcript file(s) processed successfully`
      })
    }

    if (matchedFiles.length > 0) {
      toast({
        title: "Auto-matched files", 
        description: `${matchedFiles.length} transcript(s) auto-matched with audio files`,
      })
    }

    if (unMatchedFiles.length > 0) {
      toast({
        title: "Unmatched transcripts",
        description: `${unMatchedFiles.length} transcript(s) created new sessions: ${unMatchedFiles.join(', ')}`,
      })
    }

    // Set active session to first processed file if none selected
    if (!activeSessionId && filesToProcess.length > 0) {
      const firstSession = fileSessions.find(s => s.transcriptFile?.name === filesToProcess[0].name)
      if (firstSession) {
        setActiveSessionId(firstSession.id)
      }
    }
  }, [activeSession, activeSessionId, fileSessions, getFileNameWithoutExtension, toast, createFileSession])

  // Handle transcript generation for specific file
  const handleRunTranscription = useCallback(async (sessionId: string) => {
    const session = fileSessions.find(s => s.id === sessionId)
    if (!session?.audioFile) return
    
    setFileSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, isTranscribing: true } : s
    ))
    
    try {
      const mockTranscript = await generateMockTranscript(sessionId, session.audioFile.name)
      
      setFileSessions(prev => prev.map(s => {
        if (s.id === sessionId) {
          return { 
            ...s, 
            transcriptData: mockTranscript,
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
  }, [fileSessions, generateMockTranscript, toast])

  // Handle checklist upload
  const handleChecklistUpload = useCallback((newChecklist: Checklist) => {
    setChecklist(newChecklist)
    toast({
      title: "Checklist loaded",
      description: `${newChecklist.name} is ready for analysis`
    })
  }, [toast])

  // Handle analysis for specific file
  const handleAnalyzeFile = useCallback(async (sessionId: string) => {
    if (!checklist) return
    
    setFileSessions(prev => prev.map(s => 
      s.id === sessionId ? { ...s, isAnalyzing: true } : s
    ))
    
    try {
      const results = await generateMockAnalysis(sessionId, checklist)
      
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
  }, [checklist, generateMockAnalysis, toast])

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
        generateMockAnalysis(session.id, checklist)
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
  }, [checklist, fileSessions, generateMockAnalysis, toast])

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
  }, [])

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
  }, [activeSessionId, fileSessions, toast])

  // Handle save
  const handleSave = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    setHasUnsavedChanges(false)
    toast({
      title: "Scoring saved",
      description: "All changes have been saved successfully"
    })
  }, [toast])

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
  }, [checklist, fileSessions, globalStats, toast])

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
  }, [toast])

  // Bulk operations handlers
  const handleSelectAll = useCallback(() => {
    if (selectedSessions.size === paginatedSessions.length) {
      setSelectedSessions(new Set())
    } else {
      setSelectedSessions(new Set(paginatedSessions.map(s => s.id)))
    }
  }, [selectedSessions.size, paginatedSessions])

  const handleSelectAllInSession = useCallback(() => {
    if (selectedSessions.size === filteredSessions.length) {
      setSelectedSessions(new Set())
    } else {
      setSelectedSessions(new Set(filteredSessions.map(s => s.id)))
    }
  }, [selectedSessions.size, filteredSessions])

  const handleSelectUnprocessed = useCallback(() => {
    const unprocessedSessions = filteredSessions.filter(session => 
      !session.transcriptData || session.analysisResults.length === 0
    )
    setSelectedSessions(new Set(unprocessedSessions.map(s => s.id)))
  }, [filteredSessions])

  const handleSelectSession = useCallback((sessionId: string) => {
    const newSelected = new Set(selectedSessions)
    if (newSelected.has(sessionId)) {
      newSelected.delete(sessionId)
    } else {
      newSelected.add(sessionId)
    }
    setSelectedSessions(newSelected)
  }, [selectedSessions])

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
  }, [selectedSessions, fileSessions, handleRunTranscription, toast])

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
  }, [selectedSessions, checklist, fileSessions, handleAnalyzeFile, toast])

  const handleBulkDelete = useCallback(() => {
    if (selectedSessions.size === 0) return
    
    setFileSessions(prev => prev.filter(s => !selectedSessions.has(s.id)))
    setSelectedSessions(new Set())
    
    toast({
      title: "Files deleted",
      description: `Removed ${selectedSessions.size} files`
    })
  }, [selectedSessions, toast])

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
  }, [selectedSessions, checklist, fileSessions, handleRunTranscription, handleAnalyzeFile, toast])

    return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 py-6">
          <h1 className="text-3xl font-bold">Multi-File Call/Chat Scoring Platform</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Evaluate operator performance across multiple files using AI-powered analysis and human feedback
          </p>
        </div>

        {/* Analytics Dashboard */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="individual">Individual Stats</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Quick Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Quick Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{globalStats.totalFiles}</div>
                    <div className="text-sm text-gray-500">Total Files</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{globalStats.transcribedFiles}</div>
                    <div className="text-sm text-gray-500">Transcribed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{globalStats.analyzedFiles}</div>
                    <div className="text-sm text-gray-500">Analyzed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{globalStats.processingFiles}</div>
                    <div className="text-sm text-gray-500">Processing</div>
                  </div>
                </div>
                
                {globalStats.totalFiles > 0 && (
                  <div className="mt-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Overall Progress</span>
                      <span>{Math.round((globalStats.analyzedFiles / globalStats.totalFiles) * 100)}%</span>
                    </div>
                    <Progress value={(globalStats.analyzedFiles / globalStats.totalFiles) * 100} className="h-2" />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            {/* Comprehensive Analytics */}
            <GeneralAnalytics sessions={fileSessions} checklist={checklist} />
          </TabsContent>
          
          <TabsContent value="files" className="space-y-6">
            {/* Enhanced File Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileAudio className="h-5 w-5" />
              File Upload & Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <FileUploadSection
              audioFile={activeSession?.audioFile || null}
              transcriptFile={activeSession?.transcriptFile || null}
              onAudioUpload={(files) => handleAudioUpload(Array.isArray(files) ? files : [files])}
              onTranscriptUpload={handleTranscriptUpload}
              onTranscribe={() => activeSessionId && handleRunTranscription(activeSessionId)}
              isTranscribing={activeSession?.isTranscribing || false}
              hasTranscript={!!activeSession?.transcriptData}
              supportMultiple={true}
            />
          </CardContent>
        </Card>

        {/* Enhanced File Management System */}
        {fileSessions.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  File Management ({filteredSessions.length} of {fileSessions.length})
                </CardTitle>
                
                {/* Search and Filters */}
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search files..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 w-full sm:w-64"
                    />
                  </div>
                  
                  <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="transcribed">Transcribed</SelectItem>
                      <SelectItem value="analyzed">Analyzed</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="date">Sort by Date</SelectItem>
                      <SelectItem value="name">Sort by Name</SelectItem>
                      <SelectItem value="status">Sort by Status</SelectItem>
                      <SelectItem value="progress">Sort by Progress</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex gap-1">
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
        </div>
      </div>
              </div>
              
              {/* Enhanced Bulk Operations Bar */}
              {selectedSessions.size > 0 && (
                <div className="space-y-3 mt-4">
                  <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        {selectedSessions.size} file(s) selected
                      </span>
                      {batchProgress && (
                        <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>
                            {batchProgress.stage === 'transcription' ? 'Transcribing' : 
                             batchProgress.stage === 'analysis' ? 'Analyzing' : 'Completing'} 
                            {batchProgress.currentFile ? ` "${batchProgress.currentFile}"` : ''}
                            ({batchProgress.current}/{batchProgress.total})
                          </span>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={handleSmartBatchProcess}
                        disabled={bulkProcessing || !checklist}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Smart Batch Process
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleBulkTranscription}
                        disabled={bulkProcessing}
                      >
                        <FileAudio className="h-4 w-4 mr-2" />
                        Transcribe
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleBulkAnalysis}
                        disabled={bulkProcessing || !checklist}
                      >
                        <Sparkles className="h-4 w-4 mr-2" />
                        Analyze
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleBulkDelete}
                        disabled={bulkProcessing}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </div>
                  </div>
                  
                  {/* Batch Progress Bar */}
                  {batchProgress && (
                    <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                      <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300 mb-2">
                        <span className="font-medium">
                          {batchProgress.stage === 'transcription' ? '🎙️ Transcribing Audio Files' : 
                           batchProgress.stage === 'analysis' ? '🧠 Running AI Analysis' : 
                           '✅ Batch Processing Complete'}
                        </span>
                        <span>{Math.round((batchProgress.current / batchProgress.total) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(batchProgress.current / batchProgress.total) * 100} 
                        className="h-2 mb-2" 
                      />
                      {batchProgress.currentFile && (
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          Current: {batchProgress.currentFile}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardHeader>
            
            <CardContent>
              {/* Select All Controls */}
              <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={selectedSessions.size === paginatedSessions.length && paginatedSessions.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                    <span className="text-sm font-medium">
                      Select all on this page ({paginatedSessions.length} items)
                    </span>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectAllInSession}
                    className="text-xs"
                  >
                    {selectedSessions.size === filteredSessions.length && filteredSessions.length > 0 ? 
                      "Deselect All" : 
                      `Select All Files (${filteredSessions.length})`
                    }
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSelectUnprocessed}
                    className="text-xs bg-gradient-to-r from-orange-50 to-red-50 hover:from-orange-100 hover:to-red-100 border-orange-200 text-orange-700"
                  >
                    📋 Select Unprocessed ({filteredSessions.filter(s => !s.transcriptData || s.analysisResults.length === 0).length})
                  </Button>
                </div>
                
                {bulkProcessing && (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-600">Processing...</span>
                  </div>
                )}
              </div>

              {/* File List/Grid View */}
              {viewMode === 'list' ? (
                <div className="space-y-2">
                  {paginatedSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`flex items-center gap-4 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        activeSessionId === session.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''
                      }`}
                      onClick={() => setActiveSessionId(session.id)}
                    >
                      <Checkbox
                        checked={selectedSessions.has(session.id)}
                        onCheckedChange={() => handleSelectSession(session.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3">
                          <FileAudio className="h-5 w-5 text-blue-600" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">
                              {session.audioFile?.name || "No audio file"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {session.audioFile && `${(session.audioFile.size / 1024 / 1024).toFixed(1)} MB`}
                              {session.transcriptFile && ` • Transcript: ${session.transcriptFile.name}`}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Badge variant={session.audioFile ? "default" : "secondary"} className="text-xs">
                          Audio
                        </Badge>
                        <Badge variant={session.transcriptData ? "default" : "secondary"} className="text-xs">
                          Transcript
                        </Badge>
                        <Badge variant={session.analysisResults.length > 0 ? "default" : "secondary"} className="text-xs">
                          Analysis
                        </Badge>
                      </div>
                      
                      <div className="text-right min-w-0">
                        {session.isTranscribing && (
                          <div className="flex items-center gap-2 text-blue-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-xs">Transcribing...</span>
                          </div>
                        )}
                        {session.isAnalyzing && (
                          <div className="flex items-center gap-2 text-purple-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-xs">Analyzing...</span>
                          </div>
                        )}
                        {!session.isTranscribing && !session.isAnalyzing && (
                          <div className="text-xs text-gray-500">
                            {session.analysisResults.length > 0 ? 'Completed' : 
                             session.transcriptData ? 'Ready for Analysis' : 
                             'Pending Transcription'}
                          </div>
                        )}
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
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {paginatedSessions.map((session) => (
                    <div
                      key={session.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                        activeSessionId === session.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' : ''
                      }`}
                      onClick={() => setActiveSessionId(session.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <Checkbox
                          checked={selectedSessions.has(session.id)}
                          onCheckedChange={() => handleSelectSession(session.id)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div
                          onClick={(e) => {
                            e.stopPropagation()
                            handleRemoveSession(session.id)
                          }}
                          className="h-6 w-6 p-1 cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/30 rounded flex items-center justify-center"
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <FileAudio className="h-5 w-5 text-blue-600" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate text-sm">
                              {session.audioFile?.name || "No audio"}
                            </div>
                            <div className="text-xs text-gray-500">
                              {session.audioFile && `${(session.audioFile.size / 1024 / 1024).toFixed(1)} MB`}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          <Badge variant={session.audioFile ? "default" : "secondary"} className="text-xs">
                            Audio
                          </Badge>
                          <Badge variant={session.transcriptData ? "default" : "secondary"} className="text-xs">
                            Script
                          </Badge>
                          <Badge variant={session.analysisResults.length > 0 ? "default" : "secondary"} className="text-xs">
                            Analysis
                          </Badge>
                        </div>
                        
                        {(session.isTranscribing || session.isAnalyzing) && (
                          <div className="text-xs text-blue-600 flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {session.isTranscribing ? "Transcribing..." : "Analyzing..."}
                          </div>
                        )}
                        
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRunTranscription(session.id)
                            }}
                            disabled={session.isTranscribing || !!session.transcriptData}
                            className="flex-1"
                          >
                            <FileText className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleAnalyzeFile(session.id)
                            }}
                            disabled={!session.transcriptData || !checklist || session.isAnalyzing || session.analysisResults.length > 0}
                            className="flex-1"
                          >
                            <Sparkles className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-gray-500">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredSessions.length)} of {filteredSessions.length} files
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <span className="px-3 py-2 text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Active Session Detailed View */}
        {activeSession && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Detailed Analysis - {activeSession.audioFile?.name || "Session"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* File Details */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">File Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {activeSession.audioFile && (
                      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileAudio className="h-8 w-8 text-blue-600" />
                          <div>
                            <div className="font-medium">{activeSession.audioFile.name}</div>
                            <div className="text-sm text-gray-500">
                              {(activeSession.audioFile.size / 1024 / 1024).toFixed(1)} MB
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRunTranscription(activeSession.id)}
                            disabled={activeSession.isTranscribing || !!activeSession.transcriptData}
                          >
                            {activeSession.isTranscribing ? "Processing..." : "Transcribe"}
                          </Button>
                        </div>
                      </div>
                    )}

                    {activeSession.transcriptData && (
                      <div className="p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                        <div className="flex items-center gap-3 mb-2">
                          <FileText className="h-8 w-8 text-green-600" />
                          <div>
                            <div className="font-medium">Transcript Ready</div>
                            <div className="text-sm text-gray-500">
                              {activeSession.transcriptData.wordCount} words, {Math.round(activeSession.transcriptData.duration)}s
                            </div>
                          </div>
                        </div>
                        <div className="text-sm text-gray-600">
                          Confidence: {Math.round(activeSession.transcriptData.confidence * 100)}% | 
                          Language: {activeSession.transcriptData.language.toUpperCase()} |
                          Processing: {activeSession.transcriptData.processingTime.toFixed(1)}s
                        </div>
                      </div>
                    )}

                    {activeSession.analysisResults.length > 0 && (
                      <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <Sparkles className="h-8 w-8 text-purple-600" />
                          <div>
                            <div className="font-medium">Analysis Complete</div>
                            <div className="text-sm text-gray-500">
                              {activeSession.analysisResults.length} criteria evaluated
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      onClick={() => handleAnalyzeFile(activeSession.id)}
                      disabled={!activeSession.transcriptData || !checklist || activeSession.isAnalyzing || activeSession.analysisResults.length > 0}
                      className="w-full"
                    >
                      <Sparkles className="h-4 w-4 mr-2" />
                      {activeSession.isAnalyzing ? "Analyzing..." : "Run Analysis"}
                    </Button>

                    {activeSession.transcriptData && (
                      <Button variant="outline" className="w-full">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        View Transcript
                      </Button>
                    )}

                    {activeSession.analysisResults.length > 0 && (
                      <Button variant="outline" className="w-full">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        View Results
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Transcript Viewer for active session */}
              {activeSession.transcriptData && (
                <div className="mt-6">
                  <TranscriptViewer
                    transcriptData={activeSession.transcriptData}
                    audioFile={activeSession.audioFile || null}
                  />
                </div>
              )}

              {/* Analysis Results for active session */}
              {activeSession.analysisResults.length > 0 && checklist && (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <AutoAnalysisSection
                    checklist={checklist}
                    analysisResults={activeSession.analysisResults}
                    isAnalyzing={activeSession.isAnalyzing}
                    onAnalyze={() => handleAnalyzeFile(activeSession.id)}
                    onScoreUpdate={(criterionId: string, categoryId: string, score: 0 | 1 | "?", explanation?: string) => 
                      handleScoreUpdate(activeSession.id, criterionId, categoryId, score, explanation)
                    }
                  />

                  <StatisticsSection
                    analysisResults={activeSession.analysisResults}
                    checklist={checklist}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}
          </TabsContent>
          
          <TabsContent value="individual" className="space-y-6">
            {/* Individual File Statistics */}
            {activeSession && (
              <FileStatistics
                session={activeSession}
                checklist={checklist}
                onViewTranscript={() => {}}
                onEditAnalysis={() => {}}
                onPlayAudio={() => {}}
                onDownload={() => {}}
              />
            )}
            
            {!activeSession && (
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Select a file from the Files tab to view individual statistics</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Checklist Section */}
        <ChecklistSection
          checklist={checklist}
          onChecklistUpload={handleChecklistUpload}
        />

        {/* Validation Alert */}
        {fileSessions.length > 0 && (!checklist || !fileSessions.some(s => s.transcriptData)) && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {!checklist && !fileSessions.some(s => s.transcriptData)
                ? "Please upload a checklist and ensure at least one file has a transcript to proceed with analysis."
                : !checklist 
                ? "Please upload or create a checklist to proceed with analysis."
                : "Please ensure at least one file has a transcript (upload or generate from audio)."
              }
            </AlertDescription>
          </Alert>
        )}

        {/* Bottom Controls */}
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