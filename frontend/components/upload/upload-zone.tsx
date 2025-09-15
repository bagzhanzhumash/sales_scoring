"use client"

import type React from "react"

import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Upload, FileAudio, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAdvancedDragDrop } from "@/hooks/use-advanced-drag-drop"

interface UploadZoneProps {
  onFilesSelected: (files: FileList) => void
  disabled?: boolean
  acceptedFormats: string[]
  maxFileSize: number
  maxFiles?: number
}

export function UploadZone({ onFilesSelected, disabled, acceptedFormats, maxFileSize, maxFiles }: UploadZoneProps) {
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validateFiles = useCallback(
    (files: FileList): { valid: FileList; errors: string[] } => {
      const validFiles: File[] = []
      const newErrors: string[] = []

      Array.from(files).forEach((file) => {
        // Check file type - better validation logic
        const isValidType = acceptedFormats.some((format) => {
          // Direct MIME type match
          if (file.type === format) return true
          
          // Also check file extension as fallback for edge cases
          const ext = file.name.toLowerCase().split('.').pop()
          if (ext === 'mp3' && (format === 'audio/mpeg' || format === 'audio/mp3')) return true
          if (ext === 'wav' && format === 'audio/wav') return true
          if (ext === 'm4a' && (format === 'audio/mp4' || format === 'audio/x-m4a' || format === 'audio/m4a')) return true
          if (ext === 'ogg' && format === 'audio/ogg') return true
          
          return false
        })
        
        if (!isValidType) {
          newErrors.push(`${file.name}: Unsupported format. Please use MP3, WAV, M4A, or OGG.`)
          return
        }

        // Check file size
        if (file.size > maxFileSize) {
          const maxSizeMB = Math.round(maxFileSize / (1024 * 1024))
          newErrors.push(`${file.name}: File too large. Maximum size is ${maxSizeMB}MB.`)
          return
        }

        validFiles.push(file)
      })

      // Check max files limit
      if (maxFiles && validFiles.length > maxFiles) {
        newErrors.push(`Too many files. Maximum ${maxFiles} files allowed.`)
        return { valid: new DataTransfer().files, errors: newErrors }
      }

      // Create new FileList with valid files
      const dataTransfer = new DataTransfer()
      validFiles.forEach((file) => dataTransfer.items.add(file))

      return { valid: dataTransfer.files, errors: newErrors }
    },
    [acceptedFormats, maxFileSize, maxFiles],
  )

  const handleFilesDropped = useCallback(
    (files: FileList) => {
      const { valid, errors } = validateFiles(files)
      setErrors(errors)

      if (valid.length > 0) {
        onFilesSelected(valid)
      }
    },
    [validateFiles, onFilesSelected],
  )

  const { isDragActive, dragProps } = useAdvancedDragDrop(handleFilesDropped)

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesDropped(e.target.files)
      // Reset input
      e.target.value = ""
    }
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const formatFileSize = (bytes: number) => {
    return Math.round(bytes / (1024 * 1024)) + "MB"
  }

  return (
    <div className="space-y-4">
      {/* Upload Zone */}
      <motion.div
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-300 ${
          disabled
            ? "border-slate-300 bg-slate-100 cursor-not-allowed"
            : isDragActive
              ? "border-blue-400 bg-blue-50 dark:bg-blue-900/20"
              : "border-slate-300 dark:border-slate-600 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-800 dark:to-slate-700 hover:border-blue-300 cursor-pointer"
        }`}
        {...dragProps}
        onClick={disabled ? undefined : handleBrowseClick}
        whileHover={disabled ? {} : { scale: 1.02 }}
        whileTap={disabled ? {} : { scale: 0.98 }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={`${acceptedFormats.join(",")}, .mp3, .wav, .m4a, .ogg`}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
        />

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Icon */}
          <motion.div
            className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
              isDragActive ? "bg-blue-100 dark:bg-blue-900/30" : "bg-slate-100 dark:bg-slate-700"
            }`}
            animate={isDragActive ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: isDragActive ? Number.POSITIVE_INFINITY : 0 }}
          >
            <FileAudio className={`w-8 h-8 ${isDragActive ? "text-blue-600" : "text-slate-500"}`} />
          </motion.div>

          {/* Text */}
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
              {isDragActive ? "Drop your files here" : "Drop your audio files here"}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">or</p>
            <Button
              onClick={handleBrowseClick}
              disabled={disabled}
              className="bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              <Upload className="w-5 h-5 mr-2" />
              Browse Files
            </Button>
          </div>

          {/* File Info */}
          <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
            <p>📊 Supported: MP3, WAV, M4A, OGG</p>
            <p>📏 Max size: {formatFileSize(maxFileSize)} per file</p>
            <p>⚡ Instant processing available</p>
          </div>
        </motion.div>

        {/* Drag Overlay */}
        <AnimatePresence>
          {isDragActive && (
            <motion.div
              className="absolute inset-0 bg-blue-500/10 border-2 border-blue-400 rounded-2xl flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="text-blue-600 font-semibold text-lg">Drop files to upload</div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Errors */}
      <AnimatePresence>
        {errors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4"
          >
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="font-medium text-red-900 dark:text-red-100">Upload Errors</h4>
                <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
