"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  MessageSquare,
  Play,
  Pause,
  Volume2,
  VolumeX,
  SkipBack,
  SkipForward,
  Clock,
  User,
  Headphones,
  RotateCcw,
  Loader2,
  AlertTriangle,
  Keyboard,
  Repeat,
  MoreHorizontal
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
  text: string
  segments: TranscriptSegment[]
}

interface UploadedFile {
  file: File
  name: string
  size: number
  type: string
}

interface TranscriptViewerProps {
  transcriptData: TranscriptData
  audioFile: UploadedFile | null
  focusTimestamp?: number | null
}

export function TranscriptViewer({
  transcriptData,
  audioFile,
  focusTimestamp
}: TranscriptViewerProps) {
  const speakerLabels: Record<TranscriptSegment["speaker"], string> = {
    Operator: "Оператор",
    Client: "Клиент"
  }
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState([80])
  const [isMuted, setIsMuted] = useState(false)
  const [activeSegment, setActiveSegment] = useState<string | null>(null)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoopingSegment, setIsLoopingSegment] = useState(false)
  const [loopSegment, setLoopSegment] = useState<TranscriptSegment | null>(null)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Audio URL management with cleanup
  useEffect(() => {
    if (audioFile) {
      const url = URL.createObjectURL(audioFile.file)
      setAudioUrl(url)
      setError(null)
      
      return () => {
        URL.revokeObjectURL(url)
        setAudioUrl(null)
      }
    } else {
      setAudioUrl(null)
    }
  }, [audioFile])

  // Enhanced audio controls with error handling
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    const updateTime = () => {
      setCurrentTime(audio.currentTime)
      
      // Find active segment based on current time
      const active = transcriptData.segments.find(segment => 
        audio.currentTime >= segment.startTime && audio.currentTime <= segment.endTime
      )
      setActiveSegment(active?.id || null)

      // Handle segment looping
      if (isLoopingSegment && loopSegment) {
        if (audio.currentTime >= loopSegment.endTime) {
          audio.currentTime = loopSegment.startTime
        }
      }
    }
    
    const updateDuration = () => {
      setDuration(audio.duration)
      setIsLoading(false)
    }
    
    const handleEnded = () => {
      setIsPlaying(false)
      if (isLoopingSegment && loopSegment) {
        audio.currentTime = loopSegment.startTime
        audio.play()
      }
    }

    const handleLoadStart = () => setIsLoading(true)
    const handleCanPlay = () => setIsLoading(false)
    const handleError = () => {
      setError("Не удалось загрузить аудио. Проверьте формат записи.")
      setIsLoading(false)
      setIsPlaying(false)
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('loadedmetadata', updateDuration)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('loadstart', handleLoadStart)
    audio.addEventListener('canplay', handleCanPlay)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('loadedmetadata', updateDuration)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('loadstart', handleLoadStart)
      audio.removeEventListener('canplay', handleCanPlay)
      audio.removeEventListener('error', handleError)
    }
  }, [audioUrl, transcriptData.segments, isLoopingSegment, loopSegment])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!audioFile) return
      
      // Don't trigger shortcuts if user is typing in an input
      if ((e.target as HTMLElement).tagName === 'INPUT') return

      switch (e.key.toLowerCase()) {
        case ' ':
          e.preventDefault()
          togglePlayPause()
          break
        case 'arrowleft':
          e.preventDefault()
          skipBackward()
          break
        case 'arrowright':
          e.preventDefault()
          skipForward()
          break
        case 'm':
          e.preventDefault()
          toggleMute()
          break
        case 'l':
          e.preventDefault()
          toggleSegmentLoop()
          break
        case 'r':
          e.preventDefault()
          restart()
          break
        case '?':
        case '/':
          e.preventDefault()
          setShowKeyboardShortcuts(!showKeyboardShortcuts)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [audioFile, isLoopingSegment, showKeyboardShortcuts])

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio || isLoading) return

    if (isPlaying) {
      audio.pause()
    } else {
      audio.play().catch(() => {
        setError("Не удаётся воспроизвести аудио. Попробуйте ещё раз.")
      })
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying, isLoading])

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    
    audio.currentTime = Math.max(0, Math.min(duration, time))
    setCurrentTime(audio.currentTime)
  }, [duration])

  const jumpToSegment = useCallback((segment: TranscriptSegment) => {
    seekTo(segment.startTime)
    setActiveSegment(segment.id)

    // Scroll to segment
    const element = document.getElementById(`segment-${segment.id}`)
    if (element && scrollAreaRef.current) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [seekTo])

  useEffect(() => {
    if (focusTimestamp === null || focusTimestamp === undefined) return

    const target = transcriptData.segments.find(segment =>
      focusTimestamp >= segment.startTime && focusTimestamp <= segment.endTime
    ) || transcriptData.segments.find(segment => focusTimestamp <= segment.startTime)

    if (!target) return

    setActiveSegment(target.id)

    const element = document.getElementById(`segment-${target.id}`)
    if (element && scrollAreaRef.current) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    const audio = audioRef.current
    if (audio && Number.isFinite(focusTimestamp)) {
      const boundedTime = Math.max(target.startTime, Math.min(target.endTime, focusTimestamp))
      audio.pause()
      audio.currentTime = boundedTime
      setCurrentTime(boundedTime)
      setIsPlaying(false)
    }
  }, [focusTimestamp, transcriptData.segments])

  const formatTime = useCallback((seconds: number) => {
    if (!isFinite(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }, [])

  const handleVolumeChange = useCallback((value: number[]) => {
    setVolume(value)
    const audio = audioRef.current
    if (audio) {
      audio.volume = value[0] / 100
      if (value[0] === 0) {
        setIsMuted(true)
      } else if (isMuted) {
        setIsMuted(false)
      }
    }
  }, [isMuted])

  const toggleMute = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (isMuted) {
      audio.volume = volume[0] / 100
      setIsMuted(false)
    } else {
      audio.volume = 0
      setIsMuted(true)
    }
  }, [isMuted, volume])

  const changePlaybackSpeed = useCallback((speed: number) => {
    setPlaybackSpeed(speed)
    const audio = audioRef.current
    if (audio) {
      audio.playbackRate = speed
    }
  }, [])

  const skipBackward = useCallback(() => {
    seekTo(Math.max(0, currentTime - 10))
  }, [currentTime, seekTo])

  const skipForward = useCallback(() => {
    seekTo(Math.min(duration, currentTime + 10))
  }, [currentTime, duration, seekTo])

  const restart = useCallback(() => {
    seekTo(0)
  }, [seekTo])

  const toggleSegmentLoop = useCallback(() => {
    if (activeSegment) {
      const segment = transcriptData.segments.find(s => s.id === activeSegment)
      if (segment) {
        setIsLoopingSegment(!isLoopingSegment)
        setLoopSegment(isLoopingSegment ? null : segment)
      }
    }
  }, [activeSegment, isLoopingSegment, transcriptData.segments])

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Просмотр транскрипта
          {audioFile && (
            <Badge variant="secondary" className="ml-auto">
              <Headphones className="h-3 w-3 mr-1" />
              Синхронизировано
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Audio Player */}
        {audioFile && (
          <div className="space-y-4 p-4 bg-gradient-to-r from-gray-50 to-blue-50 dark:from-gray-900 dark:to-blue-950 rounded-lg border border-gray-200 dark:border-gray-700">
            <audio 
              ref={audioRef}
              src={audioUrl || undefined}
              preload="metadata"
            />
            
            {/* Audio File Info */}
            <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Headphones className="h-4 w-4" />
                <span className="font-medium">{audioFile.name}</span>
                <Badge variant="secondary" className="text-xs">
                  {(audioFile.size / 1024 / 1024).toFixed(1)} МБ
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                {isLoading && (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Загрузка аудио...</span>
                  </>
                )}
                {isLoopingSegment && loopSegment && (
                  <Badge variant="outline" className="text-xs">
                    <Repeat className="h-3 w-3 mr-1" />
                    Повтор участка
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Player Controls */}
            <div className="space-y-3">
              {/* Main Control Row */}
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={restart}
                  disabled={!audioFile || isLoading}
                  title="Сначала (R)"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={skipBackward}
                  disabled={!audioFile || isLoading}
                  title="Назад 10с (←)"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                
                <Button
                  onClick={togglePlayPause}
                  disabled={!audioFile || isLoading}
                  size="sm"
                  className="w-12 h-12"
                  title="Старт/пауза (Пробел)"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : isPlaying ? (
                    <Pause className="h-5 w-5" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={skipForward}
                  disabled={!audioFile || isLoading}
                  title="Вперёд 10с (→)"
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
                
                <Button
                  variant={isLoopingSegment ? "default" : "outline"}
                  size="sm"
                  onClick={toggleSegmentLoop}
                  disabled={!audioFile || !activeSegment}
                  title="Повторить текущий фрагмент (L)"
                >
                  <Repeat className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-2 flex-1">
                  <span className="text-xs text-gray-500 w-12">{formatTime(currentTime)}</span>
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={0.1}
                    onValueChange={(value) => seekTo(value[0])}
                    className="flex-1"
                    disabled={isLoading}
                  />
                  <span className="text-xs text-gray-500 w-12">{formatTime(duration)}</span>
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleMute}
                  disabled={!audioFile}
                  title="Вкл/выкл звук (M)"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                
                <div className="flex items-center gap-2">
                  <Slider
                    value={isMuted ? [0] : volume}
                    max={100}
                    step={1}
                    onValueChange={handleVolumeChange}
                    className="w-20"
                    disabled={!audioFile}
                  />
                </div>
                
                <select 
                  value={playbackSpeed} 
                  onChange={(e) => changePlaybackSpeed(Number(e.target.value))}
                  className="text-xs bg-white dark:bg-gray-800 border rounded px-2 py-1"
                  disabled={!audioFile}
                  title="Скорость воспроизведения"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={0.75}>0.75x</option>
                  <option value={1}>1x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2x</option>
                </select>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowKeyboardShortcuts(!showKeyboardShortcuts)}
                  title="Горячие клавиши (?)"
                >
                  <Keyboard className="h-4 w-4" />
                </Button>
              </div>

              {/* Keyboard Shortcuts Help */}
              {showKeyboardShortcuts && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="font-medium text-sm mb-2 text-blue-900 dark:text-blue-100">Горячие клавиши:</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-blue-800 dark:text-blue-200">
                    <div><kbd className="bg-blue-100 dark:bg-blue-900 px-1 rounded">Space</kbd> Старт/пауза</div>
                    <div><kbd className="bg-blue-100 dark:bg-blue-900 px-1 rounded">←/→</kbd> Перемотка 10с</div>
                    <div><kbd className="bg-blue-100 dark:bg-blue-900 px-1 rounded">M</kbd> Вкл/выкл звук</div>
                    <div><kbd className="bg-blue-100 dark:bg-blue-900 px-1 rounded">L</kbd> Повтор участка</div>
                    <div><kbd className="bg-blue-100 dark:bg-blue-900 px-1 rounded">R</kbd> С начала</div>
                    <div><kbd className="bg-blue-100 dark:bg-blue-900 px-1 rounded">?</kbd> Показать подсказки</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transcript Display */}
        <ScrollArea ref={scrollAreaRef} className="h-96 w-full border rounded-lg">
          <div className="p-4 space-y-4">
            {transcriptData.segments.map((segment, index) => (
              <div
                key={segment.id}
                id={`segment-${segment.id}`}
                className={`
                  group flex gap-3 p-4 rounded-lg transition-all cursor-pointer border-2
                  ${segment.speaker === 'Operator' ? 'ml-8' : 'mr-8'}
                  ${activeSegment === segment.id 
                    ? 'bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-300 dark:border-blue-700 shadow-lg' 
                    : isLoopingSegment && loopSegment?.id === segment.id
                    ? 'bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-300 dark:border-purple-700'
                    : 'hover:bg-gray-50 dark:hover:bg-gray-800 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
                  }
                `}
                onClick={() => jumpToSegment(segment)}
              >
                {/* Avatar */}
                <div className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-xs font-medium shrink-0
                  ${segment.speaker === 'Operator' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-green-500 text-white'
                  }
                  ${activeSegment === segment.id ? 'ring-2 ring-blue-300 dark:ring-blue-600 ring-offset-2' : ''}
                `}>
                  <User className="h-5 w-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  {/* Speaker and Timestamp */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-semibold text-sm">
                      {speakerLabels[segment.speaker]}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Clock className="h-3 w-3" />
                      <span>{segment.timestamp}</span>
                      <span className="text-gray-400">•</span>
                      <span>{formatTime(segment.endTime - segment.startTime)} длительность</span>
                    </div>
                    <div className="flex items-center gap-1 ml-auto">
                      {activeSegment === segment.id && (
                        <Badge variant="default" className="text-xs animate-pulse">
                          <Play className="h-3 w-3 mr-1" />
                          Воспроизведение
                        </Badge>
                      )}
                      {isLoopingSegment && loopSegment?.id === segment.id && (
                        <Badge variant="secondary" className="text-xs">
                          <Repeat className="h-3 w-3 mr-1" />
                          Повтор
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Message Content */}
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-2">
                    {segment.text}
                  </p>
                  
                  {/* Segment Actions (appear on hover) */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        jumpToSegment(segment)
                      }}
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Воспроизвести
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={(e) => {
                        e.stopPropagation()
                        setLoopSegment(segment)
                        setIsLoopingSegment(true)
                        jumpToSegment(segment)
                      }}
                    >
                      <Repeat className="h-3 w-3 mr-1" />
                      Повторить
                    </Button>
                  </div>
                </div>
                
                {/* Segment Number */}
                <div className="text-xs text-gray-400 font-mono shrink-0 self-start mt-1">
                  #{index + 1}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        {/* Enhanced Transcript Stats */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg space-y-3 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6 text-sm">
             <div className="flex items-center gap-2">
               <MessageSquare className="h-4 w-4 text-gray-500" />
               <span className="font-medium">{transcriptData.segments.length}</span>
                <span className="text-gray-500">сегментов</span>
             </div>
             <div className="flex items-center gap-4">
               <div className="flex items-center gap-2">
                 <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>{transcriptData.segments.filter(s => s.speaker === 'Operator').length} оператор</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                  <span>{transcriptData.segments.filter(s => s.speaker === 'Client').length} клиент</span>
                </div>
              </div>
              {duration > 0 && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <span className="font-medium">{formatTime(duration)}</span>
                  <span className="text-gray-500">всего</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {audioFile ? (
                <Badge variant="default" className="bg-green-100 text-green-700 border-green-200">
                  <Headphones className="h-3 w-3 mr-1" />
                  Аудио синхронизировано
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <MessageSquare className="h-3 w-3 mr-1" />
                  Только текст
                </Badge>
              )}
            </div>
          </div>

          {/* Controls Info */}
          {audioFile && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <Play className="h-3 w-3" />
                <span>Нажимайте на сегменты, чтобы перейти к нужной части</span>
              </div>
              <div className="flex items-center gap-2">
                <Repeat className="h-3 w-3" />
                <span>Используйте кнопку повтора для цикла сегмента</span>
              </div>
              <div className="flex items-center gap-2">
                <Keyboard className="h-3 w-3" />
                <span>Нажмите <kbd className="bg-gray-200 dark:bg-gray-700 px-1 rounded">?</kbd>, чтобы увидеть горячие клавиши</span>
              </div>
              <div className="flex items-center gap-2">
                <MoreHorizontal className="h-3 w-3" />
                <span>Наведите курсор на сегмент для быстрых действий</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 
