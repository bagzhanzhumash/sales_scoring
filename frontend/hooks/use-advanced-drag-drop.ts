"use client"

import type React from "react"

import { useState, useCallback } from "react"

export function useAdvancedDragDrop(onFilesDropped: (files: FileList) => void) {
  const [isDragActive, setIsDragActive] = useState(false)
  const [dragDepth, setDragDepth] = useState(0)

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragDepth((prev) => prev + 1)

    if (e.dataTransfer?.items) {
      const hasFiles = Array.from(e.dataTransfer.items).some((item) => item.kind === "file")
      setIsDragActive(hasFiles)
    }
  }, [])

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragDepth((prev) => prev - 1)

      if (dragDepth <= 1) {
        setIsDragActive(false)
      }
    },
    [dragDepth],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragActive(false)
      setDragDepth(0)

      const files = e.dataTransfer?.files
      if (files && files.length > 0) {
        onFilesDropped(files)
      }
    },
    [onFilesDropped],
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  return {
    isDragActive,
    dragProps: {
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDragOver: handleDragOver,
      onDrop: handleDrop,
    },
  }
}
