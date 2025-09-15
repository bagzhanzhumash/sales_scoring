"use client"

import React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface DropdownMenuProps {
  children: React.ReactNode
}

interface DropdownMenuTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

interface DropdownMenuContentProps {
  align?: "start" | "end"
  children: React.ReactNode
}

interface DropdownMenuItemProps {
  onClick?: () => void
  className?: string
  children: React.ReactNode
}

function DropdownMenuRoot({ children }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [triggerElement, setTriggerElement] = useState<HTMLElement | null>(null)

  return (
    <div className="relative">
      {React.Children.map(children, (child, index) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, {
            isOpen,
            setIsOpen,
            triggerElement,
            setTriggerElement,
            key: index,
          })
        }
        return child
      })}
    </div>
  )
}

function DropdownMenuTrigger({
  asChild,
  children,
  isOpen,
  setIsOpen,
  setTriggerElement,
}: DropdownMenuTriggerProps & any) {
  const ref = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (ref.current) {
      setTriggerElement(ref.current)
    }
  }, [setTriggerElement])

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      ref,
      onClick: (e: React.MouseEvent) => {
        e.stopPropagation()
        setIsOpen(!isOpen)
        if ((children as any).props.onClick) {
          (children as any).props.onClick(e)
        }
      },
    })
  }

  return (
    <button
      ref={ref}
      onClick={(e) => {
        e.stopPropagation()
        setIsOpen(!isOpen)
      }}
      className="inline-flex items-center justify-center"
    >
      {children}
    </button>
  )
}

function DropdownMenuContent({ align = "start", children, isOpen, setIsOpen }: DropdownMenuContentProps & any) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen, setIsOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={ref}
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className={`absolute top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50 ${
            align === "end" ? "right-0" : "left-0"
          }`}
        >
          {React.Children.map(children, (child, index) => {
            if (React.isValidElement(child)) {
              return React.cloneElement(child as any, { setIsOpen, key: index })
            }
            return child
          })}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function DropdownMenuItem({ onClick, className = "", children, setIsOpen }: DropdownMenuItemProps & any) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
        setIsOpen?.(false)
      }}
      className={`w-full text-left px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center transition-colors ${className}`}
    >
      {children}
    </button>
  )
}

function DropdownMenuSeparator() {
  return <div className="h-px bg-slate-200 dark:bg-slate-700 my-1" />
}

export const DropdownMenu = Object.assign(DropdownMenuRoot, {
  Trigger: DropdownMenuTrigger,
  Content: DropdownMenuContent,
  Item: DropdownMenuItem,
  Separator: DropdownMenuSeparator,
})

// Named exports for direct import compatibility
export { DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator }
