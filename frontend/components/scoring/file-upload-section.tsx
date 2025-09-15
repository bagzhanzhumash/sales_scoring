"use client"

import { useCallback, useState, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { 
  Upload, 
  File, 
  Music, 
  FileText, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  X,
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
  transcriptFile: UploadedFile | null
  onAudioUpload: (files: File | File[]) => void
  onTranscriptUpload: (files: File | File[]) => void
  onTranscribe: () => void
  isTranscribing: boolean
  hasTranscript: boolean
  supportMultiple?: boolean
}

export function FileUploadSection({
  audioFile,
  transcriptFile,
  onAudioUpload,
  onTranscriptUpload,
  onTranscribe,
  isTranscribing,
  hasTranscript,
  supportMultiple = false
}: FileUploadSectionProps) {
  const [uploadProgress, setUploadProgress] = useState(0)
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null)
  const [transcriptUploadProgress, setTranscriptUploadProgress] = useState(0)
  const [pendingTranscriptFiles, setPendingTranscriptFiles] = useState<File[] | null>(null)

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

  // Handle transcript upload completion with useEffect to avoid setState during render
  useEffect(() => {
    if (transcriptUploadProgress === 100 && pendingTranscriptFiles) {
      setTimeout(() => {
        console.log('Calling onTranscriptUpload with', pendingTranscriptFiles);
        if (supportMultiple) {
          onTranscriptUpload(pendingTranscriptFiles)
        } else {
          onTranscriptUpload(pendingTranscriptFiles[0])
        }
        setPendingTranscriptFiles(null)
        setTranscriptUploadProgress(0)
      }, 0)
    }
  }, [transcriptUploadProgress, pendingTranscriptFiles, onTranscriptUpload, supportMultiple])

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

  // Transcript file dropzone - supports multiple files
  const onTranscriptDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      // Store transcript files and start upload progress simulation
      setPendingTranscriptFiles(acceptedFiles)
      setTranscriptUploadProgress(0)
      
      const interval = setInterval(() => {
        setTranscriptUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return prev + 10
        })
      }, 50) // Faster for transcript files since they're smaller
    }
  }, [supportMultiple])

  const {
    getRootProps: getTranscriptRootProps,
    getInputProps: getTranscriptInputProps,
    isDragActive: isTranscriptDragActive
  } = useDropzone({
    onDrop: onTranscriptDrop,
    accept: {
      'text/*': ['.txt', '.json', '.srt', '.vtt', '.csv'],
      'application/json': ['.json']
    },
    maxFiles: supportMultiple ? 200 : 1,
    maxSize: 10 * 1024 * 1024 // 10MB
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
          {supportMultiple ? "Bulk File Upload (up to 200 files)" : "File Upload"}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Audio Upload */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            Audio Files
            {supportMultiple && (
              <Badge variant="outline" className="text-xs">
                Bulk upload: up to 200 files
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
                    ? "Drop the files here..." 
                    : supportMultiple 
                    ? "Drag & drop multiple audio/video files, or click to select"
                    : "Drag & drop an audio file, or click to select"
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {supportMultiple 
                    ? "Supports MP3, WAV, M4A, OGG, MP4, AVI, MOV (max 500MB each, up to 200 files)"
                    : "Supports MP3, WAV, M4A, OGG (max 500MB)"
                  }
                </p>
                
                {supportMultiple && (
                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Select Files
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
                      Uploaded: {new Date(audioFile.uploadedAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
              </div>
              {audioFile.status && (
                <Badge 
                  variant={audioFile.status === "completed" ? "default" : "secondary"}
                  className="text-xs"
                >
                  {audioFile.status}
                </Badge>
              )}
            </div>
          )}

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-2">
              <Progress value={uploadProgress} className="h-2" />
              <p className="text-xs text-gray-500 text-center">
                {supportMultiple && pendingFiles ? 
                  `Uploading ${pendingFiles.length} file${pendingFiles.length > 1 ? 's' : ''}... ${uploadProgress}%` :
                  `Uploading... ${uploadProgress}%`
                }
              </p>
              {supportMultiple && pendingFiles && pendingFiles.length > 10 && (
                <div className="text-xs text-blue-600 text-center">
                  {pendingFiles.length > 100 ? 
                    `Extra large batch upload in progress (${pendingFiles.length} files) - This may take several minutes` :
                    `Large batch upload in progress (${pendingFiles.length} files)`
                  }
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transcript Upload */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            Transcript Files
            <Badge variant="secondary" className="ml-2">Optional</Badge>
            {supportMultiple && (
              <Badge variant="outline" className="text-xs ml-2">
                Bulk upload: up to 200 files
              </Badge>
            )}
          </h3>
          
          {!transcriptFile && !hasTranscript || supportMultiple ? (
            <div
              {...getTranscriptRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors
                ${isTranscriptDragActive 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
                  : 'border-gray-300 hover:border-gray-400 dark:border-gray-600'
                }
              `}
            >
              <input {...getTranscriptInputProps()} />
              <div className="flex flex-col items-center">
                {supportMultiple ? (
                  <FolderOpen className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                ) : (
                  <FileText className="h-6 w-6 mx-auto mb-2 text-gray-400" />
                )}
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {isTranscriptDragActive 
                    ? "Drop the transcript files here..." 
                    : supportMultiple
                    ? "Drag & drop multiple transcript files, or click to select"
                    : "Upload existing transcript (optional)"
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {supportMultiple 
                    ? "Supports TXT, JSON, SRT, VTT, CSV (max 10MB each, up to 200 files)"
                    : "Supports TXT, JSON, SRT, VTT, CSV (max 10MB)"
                  }
                </p>
                
                {supportMultiple && (
                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Select Transcript Files
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Current transcript file display (for single file mode) */}
          {transcriptFile && !supportMultiple && (
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <FileText className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium">{transcriptFile.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(transcriptFile.size)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Generated transcript display */}
          {hasTranscript && !transcriptFile && (
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium">Transcript Generated</p>
                  <p className="text-xs text-gray-500">Ready for analysis</p>
                </div>
              </div>
            </div>
          )}

          {/* Transcript upload progress */}
          {transcriptUploadProgress > 0 && transcriptUploadProgress < 100 && (
            <div className="space-y-2">
              <Progress value={transcriptUploadProgress} className="h-2" />
              <p className="text-xs text-gray-500 text-center">
                {supportMultiple && pendingTranscriptFiles ? 
                  `Uploading ${pendingTranscriptFiles.length} transcript file${pendingTranscriptFiles.length > 1 ? 's' : ''}... ${transcriptUploadProgress}%` :
                  `Uploading transcript... ${transcriptUploadProgress}%`
                }
              </p>
              {supportMultiple && pendingTranscriptFiles && pendingTranscriptFiles.length > 10 && (
                <div className="text-xs text-blue-600 text-center">
                  Large batch transcript upload ({pendingTranscriptFiles.length} files)
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transcription Action */}
        {audioFile && !hasTranscript && (
          <div className="space-y-3">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                No transcript detected. Click "Run Transcription" to generate transcript from audio.
              </AlertDescription>
            </Alert>
            
            <Button 
              onClick={onTranscribe}
              disabled={isTranscribing}
              className="w-full"
            >
              {isTranscribing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Transcribing...
                </>
              ) : (
                "Run Transcription"
              )}
            </Button>
          </div>
        )}

        {/* Help Text */}
        <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
          <h4 className="font-medium mb-1">File Processing Tips:</h4>
          <ul className="list-disc list-inside space-y-1">
            {supportMultiple ? (
              <>
                <li><strong>Up to 200 files:</strong> Upload multiple audio/video files for batch processing</li>
                <li>Each file will be processed individually with separate results</li>
                <li>Transcripts can be uploaded separately or generated automatically</li>
                <li>Large batch support: Perfect for processing 10+ files at once</li>
              </>
            ) : (
              <>
                <li>Upload one audio file and optionally a transcript file</li>
                <li>If no transcript is provided, we'll generate one automatically</li>
                <li>Supported formats: MP3, WAV, M4A, OGG for audio</li>
              </>
            )}
            <li>Higher quality audio produces better transcription results</li>
            <li>Processing time depends on file length and complexity</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
} 