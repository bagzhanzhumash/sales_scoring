"use client"

import { useCallback, useState, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Upload, 
  File, 
  Music, 
  CheckCircle, 
  Loader2,
  Plus,
  FolderOpen
} from "lucide-react"

interface UploadedFile {
  id?: string
  file: File
  name: string
  size: number
  type: string
  uploadedAt?: string
  status?: "pending" | "processing" | "completed" | "failed"
  progress?: number
}

interface FileUploadSectionProps {
  audioFile: UploadedFile | null
  onAudioUpload: (files: File | File[]) => void
  onTranscribe: () => void
  isTranscribing: boolean
  hasTranscript?: boolean
  supportMultiple?: boolean
}

export function FileUploadSection({
  audioFile,
  onAudioUpload,
  onTranscribe,
  isTranscribing,
  hasTranscript = false,
  supportMultiple = false
}: FileUploadSectionProps) {
  const uploadStatusLabels: Record<NonNullable<UploadedFile["status"]>, string> = {
    pending: "В очереди",
    processing: "Обработка",
    completed: "Готово",
    failed: "Ошибка"
  }
  const [uploadProgress, setUploadProgress] = useState(0)
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null)

  // Handle file upload completion with useEffect to avoid setState during render
  useEffect(() => {
    if (uploadProgress === 100 && pendingFiles) {
      // Defer the callback to next tick to avoid setState during render
      setTimeout(() => {
        if (supportMultiple) {
          onAudioUpload(pendingFiles)
        } else {
          onAudioUpload(pendingFiles[0])
        }
        setPendingFiles(null)
        setUploadProgress(0)
      }, 0)
    }
  }, [uploadProgress, pendingFiles, onAudioUpload, supportMultiple])

  // Audio file dropzone - supports multiple files
  const onAudioDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      // Store files and start upload progress simulation
      setPendingFiles(acceptedFiles)
      setUploadProgress(0)
      
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 10
        })
      }, 100)
    }
  }, [supportMultiple])

  const {
    getRootProps: getAudioRootProps,
    getInputProps: getAudioInputProps,
    isDragActive: isAudioDragActive
  } = useDropzone({
    onDrop: onAudioDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.m4a', '.ogg'],
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv'] // Support video files too
    },
    maxFiles: supportMultiple ? 200 : 1,
    maxSize: 500 * 1024 * 1024 // 500MB per file
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {supportMultiple ? "Массовая загрузка файлов (до 200 штук)" : "Загрузка файла"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Audio Upload */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            Аудиофайлы
            {supportMultiple && (
              <Badge variant="outline" className="text-xs">
                Пакет: до 200 файлов
              </Badge>
            )}
          </h3>
          
          {!audioFile || supportMultiple ? (
            <div
              {...getAudioRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${isAudioDragActive 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                  : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
                }
              `}
            >
              <input {...getAudioInputProps()} />
              <div className="flex flex-col items-center">
                {supportMultiple ? (
                  <FolderOpen className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                ) : (
                  <Music className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isAudioDragActive 
                    ? "Перетащите файлы сюда" 
                    : supportMultiple 
                    ? "Перетащите несколько аудио/видео файлов или нажмите, чтобы выбрать"
                    : "Перетащите аудио или нажмите, чтобы выбрать"
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {supportMultiple 
                    ? "Поддерживаются MP3, WAV, M4A, OGG, MP4, AVI, MOV (до 500 МБ каждый, максимум 200 файлов)"
                    : "Поддерживаются MP3, WAV, M4A, OGG (до 500 МБ)"
                  }
                </p>
                
                {supportMultiple && (
                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Выбрать файлы
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Current audio file display (for single file mode) */}
          {audioFile && !supportMultiple && (
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">{audioFile.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(audioFile.size)}</p>
                  {audioFile.uploadedAt && (
                    <p className="text-xs text-gray-500">
                      Загрузка: {new Date(audioFile.uploadedAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
              {audioFile.status && (
                <Badge 
                  variant={audioFile.status === "completed" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {uploadStatusLabels[audioFile.status] || audioFile.status}
                </Badge>
              )}
            </div>
          )}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-gray-500 text-center">
                {supportMultiple && pendingFiles ? 
                  `Загружаем ${pendingFiles.length} файл(ов)... ${uploadProgress}%` :
                  `Загрузка... ${uploadProgress}%`
                }
              </p>
              {supportMultiple && pendingFiles && pendingFiles.length > 10 && (
                <div className="text-xs text-blue-600 text-center">
                  {pendingFiles.length > 100 ? 
                    `Очень большая партия (${pendingFiles.length} файлов) — это может занять несколько минут` :
                    `Загружается большая партия (${pendingFiles.length} файлов)`
                  }
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transcript Status */}
        {audioFile && (
          <div className="space-y-3">
            {hasTranscript ? (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-sm font-medium">Транскрипт готов</p>
                    <p className="text-xs text-gray-500">Можно переходить к оценке в любое время.</p>
                  </div>
                </div>
              </div>
            ) : (
              <Button 
                onClick={onTranscribe}
                disabled={isTranscribing}
                className="w-full"
              >
                {isTranscribing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Транскрибация...
                  </>
                ) : (
                  <>
                    <File className="h-4 w-4 mr-2" />
                    Запустить транскрибацию
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <h4 className="font-medium mb-1">Подсказки по обработке файлов:</h4>
          <ul className="list-disc list-inside space-y-1">
            {supportMultiple ? (
              <>
                <li><strong>До 200 файлов:</strong> можно загрузить сразу много аудио или видео</li>
                <li>Каждый файл обрабатывается отдельно с собственными результатами</li>
                <li>Транскрипты создаются автоматически после загрузки</li>
                <li>Подходит для больших партий: удобно обрабатывать 10+ файлов</li>
              </>
            ) : (
              <>
                <li>Загружайте по одному аудио-файлу за сессию</li>
                <li>Используйте «Запустить транскрибацию» для автоматического текста</li>
                <li>Поддерживаемые форматы: MP3, WAV, M4A, OGG</li>
              </>
            )}
            <li>Чем лучше качество звука, тем точнее транскрипт</li>
            <li>Время обработки зависит от длины и сложности записи</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 
