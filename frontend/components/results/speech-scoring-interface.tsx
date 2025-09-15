"use client"

import { useState, useEffect, useRef } from "react"
import { motion } from "framer-motion"
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2,
  Check,
  X,
  HelpCircle,
  Save,
  MessageSquare,
  Download,
  Edit3,
  Loader2
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"
import type { AnalysisResult } from "@/types/projects"
import { updateCriterionScore } from "@/lib/api/analysis-api"

interface SpeechScoringInterfaceProps {
  result: AnalysisResult
  onScoreUpdate: (categoryId: string, criterionId: string, score: 0 | 1 | "?", comment?: string) => void
  onSave: () => void
  onClose: () => void
  transcript?: string
  audioUrl?: string
}

interface CriterionScore {
  score: 0 | 1 | "?"
  comment: string
  originalScore?: 0 | 1 | "?"
  isEdited: boolean
}

interface ConversationSegment {
  id: string
  speaker: "Operator" | "Client"
  text: string
  timestamp: string
  startTime: number
  endTime: number
}

export function SpeechScoringInterface({
  result,
  onScoreUpdate,
  onSave,
  onClose,
  transcript = "",
  audioUrl
}: SpeechScoringInterfaceProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState([80])
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [scores, setScores] = useState<Record<string, Record<string, CriterionScore>>>({})
  const [hasChanges, setHasChanges] = useState(false)
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const { toast } = useToast()

  // Mock conversation data - in real app this would come from transcript processing
  const conversationSegments: ConversationSegment[] = [
    {
      id: "1",
      speaker: "Operator",
      text: "Hi, yes. Eh, em, I have an issue with my banking card. I tried to withdraw cash today, couldn't do it. It showed some errors and now all ATMs tell me there is an error with my card.",
      timestamp: "0:00 - 0:01",
      startTime: 0,
      endTime: 12
    },
    {
      id: "2", 
      speaker: "Client",
      text: "Could you name yourself: your full name, date of birth and card number?",
      timestamp: "3:18 - 3:24",
      startTime: 198,
      endTime: 204
    },
    {
      id: "3",
      speaker: "Operator", 
      text: "Hi, yes. Eh, em, I have an issue with my banking card. I tried to withdraw cash today, couldn't do it. It showed some errors and now all ATMs tell me there is an error with my card.",
      timestamp: "0:00 - 0:01",
      startTime: 12,
      endTime: 24
    },
    {
      id: "4",
      speaker: "Client",
      text: "Could you name yourself: your full name, date of birth and card number?",
      timestamp: "3:18 - 3:24", 
      startTime: 24,
      endTime: 30
    }
  ]

  // Mock scoring criteria - in real app this would come from checklist
  const scoringCriteria = {
    "beginning": {
      name: "Beginning",
      criteria: [
        { id: "client_verification", text: "Client verification" },
        { id: "information_about_recording", text: "Information about recording" },
        { id: "presentation_purpose", text: "Presentation of the purpose of the conversation" },
        { id: "reason_question", text: "Reason question" },
        { id: "technical_assistance", text: "Technical assistance" }
      ]
    },
    "middle": {
      name: "Middle", 
      criteria: [
        { id: "client_verification_mid", text: "Client verification" },
        { id: "information_recording_mid", text: "Information about recording" },
        { id: "presentation_purpose_mid", text: "Presentation of the purpose of the conversation" },
        { id: "reason_question_mid", text: "Reason question" },
        { id: "technical_assistance_mid", text: "Technical assistance" }
      ]
    },
    "bottom": {
      name: "Bottom",
      criteria: [
        { id: "final_verification", text: "Final verification" },
        { id: "summary_provided", text: "Summary provided" },
        { id: "next_steps", text: "Next steps explained" }
      ]
    }
  }

  // Initialize scores from result data
  useEffect(() => {
    const initialScores: Record<string, Record<string, CriterionScore>> = {}
    
    Object.entries(scoringCriteria).forEach(([categoryId, category]) => {
      initialScores[categoryId] = {}
      category.criteria.forEach(criterion => {
        // Get existing score from result.categories if available
        const existingScore = result.categories?.[categoryId]?.[criterion.id]?.score
        initialScores[categoryId][criterion.id] = {
          score: existingScore ?? "?",
          comment: result.categories?.[categoryId]?.[criterion.id]?.comment ?? "",
          originalScore: existingScore ?? "?",
          isEdited: false
        }
      })
    })
    
    setScores(initialScores)
  }, [result])

  // Audio controls
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)
    const handleEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play()
    }
    setIsPlaying(!isPlaying)
  }

  const seekTo = (time: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = time
    setCurrentTime(time)
  }

  const updateScore = async (categoryId: string, criterionId: string, newScore: 0 | 1 | "?") => {
    setIsUpdating(true)
    
    try {
      // Update local state immediately for better UX
      setScores(prev => {
        const updated = {
          ...prev,
          [categoryId]: {
            ...prev[categoryId],
            [criterionId]: {
              ...prev[categoryId][criterionId],
              score: newScore,
              isEdited: prev[categoryId][criterionId].originalScore !== newScore
            }
          }
        }
        return updated
      })
      setHasChanges(true)
      
      // Call the API to update the score
      if (!result.id) {
        throw new Error("Analysis ID is required")
      }
      
      const response = await updateCriterionScore(result.id, {
        category_id: categoryId,
        criterion_id: criterionId,
        score: newScore,
        comment: scores[categoryId]?.[criterionId]?.comment || ""
      })
      
      if (response.success) {
        toast({
          title: "Score Updated",
          description: `${criterionId} score updated to ${newScore === "?" ? "needs review" : newScore === 1 ? "passed" : "failed"}`,
        })
        
        // Call the parent callback
        onScoreUpdate(categoryId, criterionId, newScore)
      } else {
        // Revert local state on API error
        setScores(prev => {
          const reverted = {
            ...prev,
            [categoryId]: {
              ...prev[categoryId],
              [criterionId]: {
                ...prev[categoryId][criterionId],
                score: prev[categoryId][criterionId].originalScore ?? "?",
                isEdited: false
              }
            }
          }
          return reverted
        })
        
        toast({
          title: "Update Failed",
          description: response.error || "Failed to update score",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Error updating score:', error)
      
      // Revert local state on error
      setScores(prev => {
        const reverted = {
          ...prev,
          [categoryId]: {
            ...prev[categoryId],
            [criterionId]: {
              ...prev[categoryId][criterionId],
              score: prev[categoryId][criterionId].originalScore ?? "?",
              isEdited: false
            }
          }
        }
        return reverted
      })
      
      toast({
        title: "Update Failed",
        description: "An error occurred while updating the score",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  const updateComment = (categoryId: string, criterionId: string, comment: string) => {
    setScores(prev => ({
      ...prev,
      [categoryId]: {
        ...prev[categoryId],
        [criterionId]: {
          ...prev[categoryId][criterionId],
          comment,
          isEdited: true
        }
      }
    }))
    setHasChanges(true)
  }

  const getScoreIcon = (score: 0 | 1 | "?") => {
    switch (score) {
      case 1:
        return <Check className="w-4 h-4" />
      case 0:
        return <X className="w-4 h-4" />
      default:
        return <HelpCircle className="w-4 h-4" />
    }
  }

  const getScoreColor = (score: 0 | 1 | "?") => {
    switch (score) {
      case 1:
        return "bg-emerald-500 hover:bg-emerald-600 text-white"
      case 0:
        return "bg-red-500 hover:bg-red-600 text-white"
      default:
        return "bg-amber-500 hover:bg-amber-600 text-white"
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const calculateProgress = () => {
    const totalCriteria = Object.values(scoringCriteria).reduce(
      (total, category) => total + category.criteria.length, 
      0
    )
    const scoredCriteria = Object.values(scores).reduce(
      (total, categoryScores) => 
        total + Object.values(categoryScores).filter(s => s.score !== "?").length,
      0
    )
    return Math.round((scoredCriteria / totalCriteria) * 100)
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl w-full max-w-7xl h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center space-x-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Scoring Interface
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Identify top performers in calls, chats, and video meetings
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Badge variant="outline" className="text-xs">
              {calculateProgress()}% Complete
            </Badge>
            {hasChanges && (
              <Badge variant="secondary" className="text-xs">
                <Edit3 className="w-3 h-3 mr-1" />
                Unsaved Changes
              </Badge>
            )}
            <Button 
              onClick={onSave} 
              disabled={!hasChanges || isSaving || isUpdating} 
              className="bg-gradient-to-r from-blue-500 to-purple-600"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Panel - Conversation */}
          <div className="flex-1 flex flex-col">
            {/* Conversation Header */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">
                    Albert E., 26 February 2022 14:53
                  </Badge>
                  <Badge variant="secondary">Beginning</Badge>
                </div>
                <Button variant="ghost" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Conversation Content */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {conversationSegments.map((segment) => (
                  <motion.div
                    key={segment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex space-x-3 cursor-pointer p-3 rounded-lg transition-colors ${
                      selectedSegment === segment.id 
                        ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700" 
                        : "hover:bg-slate-50 dark:hover:bg-slate-800"
                    }`}
                    onClick={() => {
                      setSelectedSegment(segment.id)
                      seekTo(segment.startTime)
                    }}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                      segment.speaker === "Operator" 
                        ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900 dark:text-cyan-300" 
                        : "bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300"
                    }`}>
                      {segment.speaker === "Operator" ? "O" : "C"}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {segment.speaker}
                        </span>
                        <span className="text-xs text-cyan-600 dark:text-cyan-400">
                          {segment.timestamp}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                        {segment.text}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Right Panel - Scoring */}
          <div className="w-80 border-l border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                Scoring Interface
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Identify top performers in calls, chats, and video meetings
              </p>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                {Object.entries(scoringCriteria).map(([categoryId, category]) => (
                  <Card key={categoryId} className="border-slate-200 dark:border-slate-700">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-slate-900 dark:text-white flex items-center justify-between">
                        {category.name}
                        <Badge variant="outline" className="text-xs">
                          {category.criteria.filter(c => 
                            scores[categoryId]?.[c.id]?.score !== "?"
                          ).length} / {category.criteria.length}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {category.criteria.map((criterion) => {
                        const score = scores[categoryId]?.[criterion.id]?.score ?? "?"
                        const isEdited = scores[categoryId]?.[criterion.id]?.isEdited ?? false
                        
                        return (
                          <div key={criterion.id} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-slate-700 dark:text-slate-300 flex-1">
                                {criterion.text}
                              </span>
                              {isEdited && (
                                <Badge variant="secondary" className="text-xs ml-2">
                                  Edited
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex space-x-1">
                              {([1, 0, "?"] as const).map((value) => (
                                <Button
                                  key={value}
                                  size="sm"
                                  variant={score === value ? "default" : "outline"}
                                  className={`w-8 h-8 p-0 ${
                                    score === value ? getScoreColor(value) : ""
                                  }`}
                                  onClick={() => updateScore(categoryId, criterion.id, value)}
                                >
                                  {getScoreIcon(value)}
                                </Button>
                              ))}
                            </div>
                            
                            {scores[categoryId]?.[criterion.id]?.comment && (
                              <Textarea
                                placeholder="Add comment..."
                                value={scores[categoryId][criterion.id].comment}
                                onChange={(e) => updateComment(categoryId, criterion.id, e.target.value)}
                                className="text-xs h-16 resize-none"
                              />
                            )}
                          </div>
                        )
                      })}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>

            {/* Score Summary */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
              <div className="text-center mb-3">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  3/15 scored
                </div>
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Progress: {calculateProgress()}%
                </div>
              </div>
              <div className="flex space-x-2">
                <Button 
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600"
                  onClick={onSave}
                  disabled={!hasChanges}
                >
                  Score Later
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600"
                  onClick={onSave}
                  disabled={!hasChanges}
                >
                  Submit Scoring
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Audio Player Controls */}
        <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-4">
          <div className="flex items-center space-x-4">
            {/* Playback Controls */}
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline">
                <SkipBack className="w-4 h-4" />
              </Button>
              <Button size="sm" onClick={togglePlayPause} className="w-10 h-10">
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button size="sm" variant="outline">
                <SkipForward className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="flex-1 flex items-center space-x-3">
              <span className="text-xs text-slate-600 dark:text-slate-400 w-12">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={1}
                  onValueChange={([value]) => seekTo(value)}
                  className="w-full"
                />
              </div>
              <span className="text-xs text-slate-600 dark:text-slate-400 w-12">
                {formatTime(duration)}
              </span>
            </div>

            {/* Volume and Settings */}
            <div className="flex items-center space-x-2">
              <Volume2 className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <div className="w-20">
                <Slider
                  value={volume}
                  max={100}
                  step={1}
                  onValueChange={setVolume}
                />
              </div>
              <Button size="sm" variant="outline" className="text-xs">
                {playbackSpeed}x
              </Button>
            </div>
          </div>
        </div>

        {/* Hidden Audio Element */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            preload="metadata"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          />
        )}
      </motion.div>
    </div>
  )
} 