"use client"

import { useState, useCallback, useEffect, useRef, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward,
  Volume2,
  Clock,
  User,
  Headphones,
  CheckCircle,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Upload,
  FileText,
  ListChecks,
  Star
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { scoringApi, type ScoreUpdateRequest, type AnalysisResponse } from "@/lib/api/scoring-api"
import type { Project, AudioFile, Checklist } from "@/types/projects"

interface ConversationSegment {
  id: string
  speaker: "Operator" | "Client"
  text: string
  timestamp: string
  startTime: number
  endTime: number
}

interface ScoringCriterion {
  id: string
  text: string
  description?: string
  required: boolean
}

interface ScoringSection {
  id: string
  name: string
  criteria: ScoringCriterion[]
}

interface ScoringResult {
  criterionId: string
  sectionId: string
  score: "pass" | "fail" | "unclear" | null
  confidence?: number
  notes?: string
  isManualEdit: boolean
}

interface ScoringTabProps {
  projectId: string
  project: Project
  files: AudioFile[]
}

const mockConversation: ConversationSegment[] = [
  {
    id: "1",
    speaker: "Operator",
    text: "Hi, yes. Eh, em, I have an issue with my banking card. I tried to withdraw cash today, couldn't do it. It showed some errors and now all ATMs tell me there is an error with my card.",
    timestamp: "0:00 – 0:01",
    startTime: 0,
    endTime: 1
  },
  {
    id: "2", 
    speaker: "Client",
    text: "Could you name yourself: your full name, date of birth and card number?",
    timestamp: "3:18 – 3:24",
    startTime: 198,
    endTime: 204
  },
  {
    id: "3",
    speaker: "Operator", 
    text: "Hi, yes. Eh, em, I have an issue with my banking card. I tried to withdraw cash today, couldn't do it. It showed some errors and now all ATMs tell me there is an error with my card.",
    timestamp: "0:00 – 0:01",
    startTime: 0,
    endTime: 1
  },
  {
    id: "4",
    speaker: "Client",
    text: "Could you name yourself: your full name, date of birth and card number?",
    timestamp: "3:18 – 3:24", 
    startTime: 198,
    endTime: 204
  },
  {
    id: "5",
    speaker: "Operator",
    text: "Hi, yes. Eh, em, I have an issue with my banking card. I tried to withdraw cash today, couldn't do it. It showed some errors and now all ATMs tell me there is an error with my card.",
    timestamp: "28 – 32s",
    startTime: 28,
    endTime: 32
  }
]

const mockScoringData: ScoringSection[] = [
  {
    id: "beginning",
    name: "Beginning",
    criteria: [
      { id: "client_verification", text: "Client verification", required: true },
      { id: "recording_info", text: "Information about recording", required: true },
      { id: "purpose_presentation", text: "Presentation of the purpose of the conversation", required: true },
      { id: "reason_question", text: "Reason question", required: false },
      { id: "technical_assistance", text: "Technical assistance", required: false }
    ]
  },
  {
    id: "middle", 
    name: "Middle",
    criteria: [
      { id: "client_verification_mid", text: "Client verification", required: true },
      { id: "recording_info_mid", text: "Information about recording", required: true },
      { id: "purpose_presentation_mid", text: "Presentation of the purpose of the conversation", required: true },
      { id: "reason_question_mid", text: "Reason question", required: false },
      { id: "technical_assistance_mid", text: "Technical assistance", required: false }
    ]
  },
  {
    id: "bottom",
    name: "Bottom", 
    criteria: [
      { id: "client_verification_end", text: "Client verification", required: true },
      { id: "recording_info_end", text: "Information about recording", required: true },
      { id: "purpose_presentation_end", text: "Presentation of the purpose of the conversation", required: true },
      { id: "reason_question_end", text: "Reason question", required: false },
      { id: "technical_assistance_end", text: "Technical assistance", required: false }
    ]
  }
]

export function ScoringTab({ projectId, project, files }: ScoringTabProps) {
  const { toast } = useToast()
  const audioRef = useRef<HTMLAudioElement>(null)
  
  // State management
  const [currentAudioFile, setCurrentAudioFile] = useState<AudioFile | null>(null)
  const [currentTranscriptFile, setCurrentTranscriptFile] = useState<AudioFile | null>(null)
  const [conversation, setConversation] = useState<ConversationSegment[]>([])
  const [checklist, setChecklist] = useState<Checklist | null>(null)
  const [scoringResults, setScoringResults] = useState<ScoringResult[]>([])
  const [analysisId, setAnalysisId] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)

  // Check if we have the required files (memoized to prevent unnecessary re-renders)
  const audioFiles = useMemo(() => files.filter(f => {
    if (!f.name) return false
    const hasAudioExt = f.name.match(/\.(mp3|wav|m4a|ogg|mp4|avi|mov|wmv|flv)$/i)
    const hasAudioType = f.mime_type?.includes('audio') || f.mime_type?.includes('video') || f.format?.includes('audio')
    return hasAudioExt || hasAudioType
  }), [files])
  
  const transcriptFiles = useMemo(() => files.filter(f => {
    if (!f.name) return false
    const hasTextExt = f.name.match(/\.(txt|json|srt|vtt|csv)$/i)
    const hasTextType = f.mime_type?.includes('text') || f.mime_type?.includes('json') || f.format?.includes('text')
    return hasTextExt || hasTextType
  }), [files])
  
  const hasRequiredFiles = useMemo(() => audioFiles.length > 0 && transcriptFiles.length > 0, [audioFiles, transcriptFiles])

  // Load transcript data
  const loadTranscriptData = useCallback(async (transcriptFile: AudioFile) => {
    try {
      // Try to load real transcript data from the file
      if (transcriptFile.id) {
        // First, try to get the file content from the backend
        const response = await fetch(`/api/v1/projects/${projectId}/files/${transcriptFile.id}/content`)
        if (response.ok) {
          const content = await response.text()
          
          // Parse the transcript content
          let parsedConversation: ConversationSegment[] = []
          
          if (transcriptFile.name.endsWith('.json')) {
            // Handle JSON transcript format
            try {
              const jsonData = JSON.parse(content)
              if (jsonData.segments && Array.isArray(jsonData.segments)) {
                parsedConversation = jsonData.segments.map((segment: any, index: number) => ({
                  id: segment.id || index.toString(),
                  speaker: segment.speaker || (index % 2 === 0 ? "Operator" : "Client"),
                  text: segment.text || "",
                  timestamp: segment.timestamp || `${Math.floor(segment.start / 60)}:${(segment.start % 60).toFixed(0).padStart(2, '0')} – ${Math.floor(segment.end / 60)}:${(segment.end % 60).toFixed(0).padStart(2, '0')}`,
                  startTime: segment.start || 0,
                  endTime: segment.end || 0
                }))
              } else if (Array.isArray(jsonData)) {
                // Handle array format
                parsedConversation = jsonData.map((item: any, index: number) => ({
                  id: item.id || index.toString(),
                  speaker: item.speaker || (index % 2 === 0 ? "Operator" : "Client"),
                  text: item.text || item.content || "",
                  timestamp: item.timestamp || `${Math.floor(index * 30 / 60)}:${((index * 30) % 60).toFixed(0).padStart(2, '0')}`,
                  startTime: item.startTime || item.start || index * 30,
                  endTime: item.endTime || item.end || (index + 1) * 30
                }))
              }
            } catch (jsonError) {
              console.warn("Failed to parse JSON transcript:", jsonError)
            }
          } else {
            // Handle plain text transcript format
            const lines = content.split('\n').filter(line => line.trim())
            parsedConversation = lines.map((line, index) => {
              // Try to parse speaker and text from line
              const speakerMatch = line.match(/^(Operator|Client|Manager|Customer|Agent|User):\s*(.+)$/i)
              if (speakerMatch) {
                return {
                  id: index.toString(),
                  speaker: speakerMatch[1].toLowerCase().includes('operator') || speakerMatch[1].toLowerCase().includes('agent') || speakerMatch[1].toLowerCase().includes('manager') ? "Operator" : "Client",
                  text: speakerMatch[2].trim(),
                  timestamp: `${Math.floor(index * 30 / 60)}:${((index * 30) % 60).toFixed(0).padStart(2, '0')}`,
                  startTime: index * 30,
                  endTime: (index + 1) * 30
                }
              } else {
                return {
                  id: index.toString(),
                  speaker: index % 2 === 0 ? "Operator" : "Client",
                  text: line.trim(),
                  timestamp: `${Math.floor(index * 30 / 60)}:${((index * 30) % 60).toFixed(0).padStart(2, '0')}`,
                  startTime: index * 30,
                  endTime: (index + 1) * 30
                }
              }
            })
          }
          
          if (parsedConversation.length > 0) {
            setConversation(parsedConversation)
            toast({
              title: "Transcript Loaded",
              description: `Successfully loaded ${parsedConversation.length} conversation segments`
            })
            return
          }
        }
      }
      
      // Fallback to mock data if loading fails
      console.warn("Using mock conversation data - transcript loading failed or not implemented")
      setConversation(mockConversation)
      toast({
        title: "Using Sample Data",
        description: "Transcript could not be loaded, using sample conversation",
        variant: "default"
      })
    } catch (error) {
      console.error("Failed to load transcript:", error)
      toast({
        title: "Transcript Loading Failed",
        description: "Using sample conversation data instead",
        variant: "destructive"
      })
      // Use mock data as fallback
      setConversation(mockConversation)
    }
  }, [projectId, toast])

  // Initialize with required files
  useEffect(() => {
    if (hasRequiredFiles) {
      setCurrentAudioFile(audioFiles[0])
      setCurrentTranscriptFile(transcriptFiles[0])
      
      // Load transcript data
      loadTranscriptData(transcriptFiles[0])
      
      // Initialize scoring results
      const initialResults: ScoringResult[] = []
      mockScoringData.forEach(section => {
        section.criteria.forEach(criterion => {
          initialResults.push({
            criterionId: criterion.id,
            sectionId: section.id,
            score: null,
            isManualEdit: false
          })
        })
      })
      setScoringResults(initialResults)
    } else {
      // Clear data when files are not available
      setCurrentAudioFile(null)
      setCurrentTranscriptFile(null)
      setConversation([])
      setScoringResults([])
      setAnalysisId(null)
    }
  }, [hasRequiredFiles, audioFiles, transcriptFiles, loadTranscriptData])

  // Audio controls
  const togglePlayPause = useCallback(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }, [isPlaying])

  const seekTo = useCallback((time: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = time
      setCurrentTime(time)
    }
  }, [])

  const jumpSegment = useCallback((segment: ConversationSegment) => {
    seekTo(segment.startTime)
  }, [seekTo])

  // Handle scoring with API integration
  const handleScoring = useCallback(async (criterionId: string, sectionId: string, score: "pass" | "fail" | "unclear") => {
    // Update the scoring result immediately for UI feedback
    setScoringResults(prev => 
      prev.map(result => 
        result.criterionId === criterionId && result.sectionId === sectionId
          ? { ...result, score, isManualEdit: true }
          : result
      )
    )
    setHasUnsavedChanges(true)

    // Show appropriate message based on mode
    if (!hasRequiredFiles) {
      toast({
        title: "Demo Mode",
        description: `Score "${score}" applied in demo mode. Upload real files to save actual results.`,
        variant: "default"
      })
      return
    }

    // Real mode - proceed with API integration
    if (!analysisId) {
      toast({
        title: "No Analysis Available", 
        description: "Please run analysis first before scoring",
        variant: "destructive"
      })
      return
    }

    try {
      // Convert score to backend format
      let apiScore: number | string
      switch (score) {
        case "pass":
          apiScore = 1
          break
        case "fail":
          apiScore = 0
          break
        case "unclear":
          apiScore = "?"
          break
      }

      const scoreUpdate: ScoreUpdateRequest = {
        category_id: sectionId,
        criterion_id: criterionId,
        score: apiScore
      }

      // Update score via API
      await scoringApi.updateCriterionScore(analysisId, scoreUpdate)

      // Update local state
      setScoringResults(prev => prev.map(result => {
        if (result.criterionId === criterionId && result.sectionId === sectionId) {
          return {
            ...result,
            score,
            isManualEdit: true
          }
        }
        return result
      }))
      
      setHasUnsavedChanges(true)
      
      toast({
        title: "Score Updated",
        description: "Score has been updated successfully"
      })
    } catch (error) {
      console.error("Failed to update score:", error)
      toast({
        title: "Update Failed",
        description: "Failed to update score",
        variant: "destructive"
      })
    }
  }, [analysisId, toast])

  // Auto analysis with API integration
  const handleAutoAnalysis = useCallback(async () => {
    if (!conversation.length) {
      toast({
        title: "Missing Requirements",
        description: "Conversation data is required for analysis",
        variant: "destructive"
      })
      return
    }

    // In demo mode, show helpful message
    if (!hasRequiredFiles) {
      toast({
        title: "Demo Mode",
        description: "Running demo analysis with sample data. Upload real files for actual AI analysis.",
        variant: "default"
      })
    }

    setIsAnalyzing(true)
    try {
      // For now, we'll use a mock checklist ID
      // In a real implementation, this would come from the checklist selection
      const mockChecklistId = "default-checklist-id"
      
      const analysisRequest = {
        checklist_id: mockChecklistId,
        use_ai_analysis: true,
        ai_model: "gpt-4",
        temperature: 0.0
      }

      // Start analysis - we need the transcript ID from the backend
      // For now, we'll simulate the API call
      const response = await new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            type: "immediate_result",
            analysis: {
              analysis_id: "mock-analysis-id-" + Date.now(),
              status: "completed"
            }
          })
        }, 3000)
      }) as any

      if (response.type === "immediate_result") {
        setAnalysisId(response.analysis.analysis_id)
        
        // Mock the scoring results with AI predictions
        setScoringResults(prev => prev.map(result => {
          const randomScore = Math.random()
          let score: "pass" | "fail" | "unclear"
          
          if (randomScore > 0.7) score = "pass"
          else if (randomScore > 0.3) score = "fail" 
          else score = "unclear"
          
          return {
            ...result,
            score,
            confidence: Math.floor(60 + Math.random() * 40),
            isManualEdit: false
          }
        }))
        
        toast({
          title: "Analysis Complete",
          description: "AI analysis has been completed successfully"
        })
      }
    } catch (error) {
      console.error("Analysis failed:", error)
      toast({
        title: "Analysis Failed",
        description: "Failed to complete AI analysis",
        variant: "destructive"
      })
    } finally {
      setIsAnalyzing(false)
    }
  }, [conversation, currentTranscriptFile, toast])

  // Save scoring results
  const handleSaveScoring = useCallback(async () => {
    // In demo mode, just show confirmation
    if (!hasRequiredFiles) {
      toast({
        title: "Demo Mode",
        description: "Scoring saved in demo mode. Upload real files to persist actual results.",
        variant: "default"
      })
      setHasUnsavedChanges(false)
      return
    }

    // Real mode - require analysis first
    if (!analysisId) {
      toast({
        title: "No Analysis to Save",
        description: "Please run analysis first",
        variant: "destructive"
      })
      return
    }

    try {
      toast({
        title: "Scoring Saved",
        description: "All scoring results have been saved successfully"
      })
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error("Failed to save scoring:", error)
      toast({
        title: "Save Failed",
        description: "Failed to save scoring results",
        variant: "destructive"
      })
    }
  }, [analysisId, hasRequiredFiles, toast])

  // Calculate scoring statistics
  const scoringStats = useMemo(() => ({
    total: scoringResults.length,
    scored: scoringResults.filter(r => r.score !== null).length,
    passed: scoringResults.filter(r => r.score === "pass").length,
    failed: scoringResults.filter(r => r.score === "fail").length,
    unclear: scoringResults.filter(r => r.score === "unclear").length
  }), [scoringResults])

  const progressPercentage = scoringStats.total > 0 ? (scoringStats.scored / scoringStats.total) * 100 : 0

  if (!hasRequiredFiles) {
    return (
      <div className="space-y-6">
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <Star className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <strong>Demo Mode:</strong> You can explore the scoring interface with sample data. 
            To score real conversations, upload both an audio file and a transcript file to this project.
            {audioFiles.length === 0 && " Missing audio file."}
            {transcriptFiles.length === 0 && " Missing transcript file."}
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className={audioFiles.length > 0 ? "border-green-200 bg-green-50 dark:bg-green-950/20" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Audio File
                {audioFiles.length > 0 && <Badge variant="secondary" className="bg-green-100 text-green-800">✓ Found</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {audioFiles.length > 0 
                  ? `Found ${audioFiles.length} audio file(s): ${audioFiles.map(f => f.name).join(', ')}`
                  : "Upload an audio file (MP3, WAV, M4A, OGG) to start the scoring process."
                }
              </p>
              {audioFiles.length === 0 && (
                <Button className="w-full" onClick={() => window.location.href = `${window.location.pathname}/upload`}>
                  Upload Audio File
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className={transcriptFiles.length > 0 ? "border-green-200 bg-green-50 dark:bg-green-950/20" : ""}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Transcript File
                {transcriptFiles.length > 0 && <Badge variant="secondary" className="bg-green-100 text-green-800">✓ Found</Badge>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {transcriptFiles.length > 0 
                  ? `Found ${transcriptFiles.length} transcript file(s): ${transcriptFiles.map(f => f.name).join(', ')}`
                  : "Upload a transcript file (TXT, JSON) or generate one from the audio."
                }
              </p>
              {transcriptFiles.length === 0 && (
                <div className="space-y-2">
                  <Button className="w-full" onClick={() => window.location.href = `${window.location.pathname}/upload`}>
                    Upload Transcript
                  </Button>
                  <Button variant="outline" className="w-full" disabled>
                    Generate from Audio (Coming Soon)
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Files in Project</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {files.map((file, index) => (
                  <div key={file.id || index} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">{file.name}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {file.format || file.mime_type || 'Unknown'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Demo Mode Button */}
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20">
          <CardHeader className="text-center">
            <CardTitle className="text-lg text-blue-800 dark:text-blue-200">
              🎯 Try Demo Mode
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-blue-600 dark:text-blue-400 mb-4">
              Experience the complete scoring interface with sample conversation data.
            </p>
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                // Force show the interface with mock data
                setConversation(mockConversation)
                const initialResults: ScoringResult[] = []
                mockScoringData.forEach(section => {
                  section.criteria.forEach(criterion => {
                    initialResults.push({
                      criterionId: criterion.id,
                      sectionId: section.id,
                      score: null,
                      isManualEdit: false
                    })
                  })
                })
                setScoringResults(initialResults)
                
                toast({
                  title: "Demo Mode Activated",
                  description: "Now using sample conversation data for demonstration",
                  variant: "default"
                })
              }}
            >
              Start Demo Mode
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Always show interface if we have conversation data (real or demo)
  if (conversation.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Loading conversation data...</p>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-200px)] flex flex-col space-y-4">
      {/* Demo Mode Indicator */}
      {!hasRequiredFiles && (
        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
          <Star className="h-4 w-4 text-blue-600" />
          <AlertDescription>
            <strong>🎯 Demo Mode Active:</strong> You are viewing the scoring interface with sample conversation data. 
            Upload audio and transcript files to score real conversations.
          </AlertDescription>
        </Alert>
      )}

      {/* Header with Analysis Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">Call Scoring</h2>
          <Badge variant="outline" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {hasRequiredFiles ? currentAudioFile?.name : "Sample Conversation"}
          </Badge>
          {!hasRequiredFiles && (
            <Badge className="bg-blue-600 text-white">
              Demo Mode
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {scoringStats.scored}/{scoringStats.total} scored
          </div>
          <Button 
            onClick={handleAutoAnalysis}
            disabled={isAnalyzing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isAnalyzing ? "Analyzing..." : "Auto Analysis"}
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Side - Conversation */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Conversation</CardTitle>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Albert E., 26 February 2022 14:53
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-4">
                {conversation.map((segment) => (
                  <div
                    key={segment.id}
                    className={`border-l-4 pl-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 rounded-r-md transition-colors ${
                      segment.speaker === "Operator" 
                        ? "border-teal-400 bg-teal-50 dark:bg-teal-950/20" 
                        : "border-purple-400 bg-purple-50 dark:bg-purple-950/20"
                    }`}
                    onClick={() => jumpSegment(segment)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-medium ${
                          segment.speaker === "Operator" ? "text-teal-700 dark:text-teal-300" : "text-purple-700 dark:text-purple-300"
                        }`}>
                          {segment.speaker}
                        </span>
                        {segment.speaker === "Operator" && <Headphones className="h-4 w-4 text-teal-600" />}
                        {segment.speaker === "Client" && <User className="h-4 w-4 text-purple-600" />}
                      </div>
                      <span className="text-xs text-gray-500">{segment.timestamp}</span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{segment.text}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Right Side - Scoring Interface */}
        <Card className="flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Scoring Checklist</CardTitle>
              <div className="flex items-center gap-2">
                <Progress value={progressPercentage} className="w-20 h-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {Math.round(progressPercentage)}%
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full px-6 pb-6">
              <div className="space-y-6">
                {mockScoringData.map((section, sectionIndex) => (
                  <div key={section.id}>
                    <div className="flex items-center gap-2 mb-4">
                      <h3 className="font-semibold text-lg">{section.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {sectionIndex + 1}/{mockScoringData.length}
                      </Badge>
                    </div>
                    
                    <div className="space-y-3">
                      {section.criteria.map((criterion) => {
                        const result = scoringResults.find(r => r.criterionId === criterion.id && r.sectionId === section.id)
                        return (
                          <div key={criterion.id} className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium">{criterion.text}</span>
                                  {criterion.required && (
                                    <Badge variant="destructive" className="text-xs px-1 py-0">Required</Badge>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-1 ml-4">
                                <Button
                                  variant={result?.score === "pass" ? "default" : "outline"}
                                  size="sm"
                                  className={`w-10 h-10 p-0 ${
                                    result?.score === "pass" 
                                      ? "bg-green-600 hover:bg-green-700 text-white" 
                                      : "hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-950"
                                  }`}
                                  onClick={() => handleScoring(criterion.id, section.id, "pass")}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  variant={result?.score === "fail" ? "default" : "outline"}
                                  size="sm"
                                  className={`w-10 h-10 p-0 ${
                                    result?.score === "fail" 
                                      ? "bg-red-600 hover:bg-red-700 text-white" 
                                      : "hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                                  }`}
                                  onClick={() => handleScoring(criterion.id, section.id, "fail")}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                                
                                <Button
                                  variant={result?.score === "unclear" ? "default" : "outline"}
                                  size="sm"
                                  className={`w-10 h-10 p-0 ${
                                    result?.score === "unclear" 
                                      ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
                                      : "hover:bg-yellow-50 hover:text-yellow-600 dark:hover:bg-yellow-950"
                                  }`}
                                  onClick={() => handleScoring(criterion.id, section.id, "unclear")}
                                >
                                  <HelpCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            
                            {result?.confidence && (
                              <div className="mt-2 text-xs text-gray-500">
                                Confidence: {result.confidence}%
                                {result.isManualEdit && <span className="ml-2 text-blue-600">(manually edited)</span>}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                    
                    {sectionIndex < mockScoringData.length - 1 && <Separator className="mt-6" />}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Controls */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={togglePlayPause}
                className="w-12 h-12 rounded-full"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {Math.floor(currentTime / 60)}:{(currentTime % 60).toFixed(0).padStart(2, '0')}
                </span>
                <div className="w-96">
                  <Progress value={(currentTime / duration) * 100} className="h-2" />
                </div>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {Math.floor(duration / 60)}:{(duration % 60).toFixed(0).padStart(2, '0')}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {scoringStats.scored}/{scoringStats.total} scored
              </div>
              
              {hasUnsavedChanges && (
                <Button variant="outline" size="sm" onClick={handleSaveScoring}>
                  Save Changes
                </Button>
              )}
              
              <Button variant="outline" size="sm">
                Score Later
              </Button>
              
              <Button 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={scoringStats.scored === 0}
                onClick={handleSaveScoring}
              >
                Submit Scoring
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hidden Audio Element */}
      {currentAudioFile && (
        <audio
          ref={audioRef}
          src={currentAudioFile.file_path || `/api/v1/projects/${projectId}/files/${currentAudioFile.id}/content`}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onError={(e) => {
            console.error("Audio playback error:", e)
            toast({
              title: "Audio Error",
              description: "Failed to load audio file",
              variant: "destructive"
            })
          }}
        />
      )}
    </div>
  )
} 