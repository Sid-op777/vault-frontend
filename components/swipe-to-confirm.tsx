"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Trash2, ArrowRight } from "lucide-react"

interface SwipeToConfirmProps {
  onConfirm: () => void
  disabled?: boolean
  text?: string
  confirmText?: string
}

export function SwipeToConfirm({
  onConfirm,
  disabled = false,
  text = "Swipe to delete",
  confirmText = "Release to delete",
}: SwipeToConfirmProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [dragProgress, setDragProgress] = useState(0)
  const [isCompleted, setIsCompleted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLDivElement>(null)
  const startXRef = useRef(0)
  const currentXRef = useRef(0)

  const SWIPE_THRESHOLD = 0.8 // 80% of the container width

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !containerRef.current || disabled) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const containerWidth = containerRect.width - 48 // Subtract thumb width
      const deltaX = e.clientX - startXRef.current
      const progress = Math.max(0, Math.min(1, deltaX / containerWidth))

      currentXRef.current = deltaX
      setDragProgress(progress)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !containerRef.current || disabled) return

      const containerRect = containerRef.current.getBoundingClientRect()
      const containerWidth = containerRect.width - 48
      const touch = e.touches[0]
      const deltaX = touch.clientX - startXRef.current
      const progress = Math.max(0, Math.min(1, deltaX / containerWidth))

      currentXRef.current = deltaX
      setDragProgress(progress)
    }

    const handleEnd = () => {
      if (!isDragging) return

      if (dragProgress >= SWIPE_THRESHOLD) {
        setIsCompleted(true)
        setTimeout(() => {
          onConfirm()
          resetSwipe()
        }, 200)
      } else {
        resetSwipe()
      }
      setIsDragging(false)
    }

    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleEnd)
      document.addEventListener("touchmove", handleTouchMove)
      document.addEventListener("touchend", handleEnd)
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleEnd)
      document.removeEventListener("touchmove", handleTouchMove)
      document.removeEventListener("touchend", handleEnd)
    }
  }, [isDragging, dragProgress, onConfirm, disabled])

  const resetSwipe = () => {
    setDragProgress(0)
    setIsCompleted(false)
    currentXRef.current = 0
  }

  const handleStart = (clientX: number) => {
    if (disabled || isCompleted) return

    setIsDragging(true)
    startXRef.current = clientX
    currentXRef.current = 0
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX)
  }

  const progressPercentage = dragProgress * 100
  const thumbPosition = dragProgress * (containerRef.current?.offsetWidth - 48 || 0)

  return (
    <div className="w-full">
      <div
        ref={containerRef}
        className={`
          relative h-12 bg-red-100 dark:bg-red-900/20 border-2 border-red-300 dark:border-red-700 
          rounded-full overflow-hidden cursor-pointer select-none transition-all duration-200
          ${isDragging ? "bg-red-200 dark:bg-red-900/40" : ""}
          ${isCompleted ? "bg-red-500 border-red-500" : ""}
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
      >
        {/* Progress Background */}
        <div
          className={`
            absolute inset-0 transition-all duration-200 rounded-full
            ${isCompleted ? "bg-red-500" : "bg-red-200 dark:bg-red-800/40"}
          `}
          style={{
            width: `${progressPercentage}%`,
          }}
        />

        {/* Text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            className={`
              text-sm font-medium transition-all duration-200
              ${dragProgress > 0.3 ? "text-white" : "text-red-700 dark:text-red-300"}
              ${isCompleted ? "text-white" : ""}
            `}
          >
            {isCompleted ? "Deleting..." : dragProgress >= SWIPE_THRESHOLD ? confirmText : text}
          </span>
        </div>

        {/* Draggable Thumb */}
        <div
          ref={thumbRef}
          className={`
            absolute left-1 top-1/2 -translate-y-1/2 w-10 h-10 bg-white dark:bg-gray-800 rounded-full shadow-lg
            flex items-center justify-center cursor-grab transition-all duration-200
            ${isDragging ? "cursor-grabbing scale-110" : ""}
            ${isCompleted ? "bg-red-600 scale-110" : ""}
            ${disabled ? "cursor-not-allowed" : ""}
          `}
          style={{
            transform: `translateX(${thumbPosition}px) translateY(-50%)`,
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          {isCompleted ? (
            <div className="animate-spin">
              <Trash2 className="w-4 h-4 text-white" />
            </div>
          ) : dragProgress >= SWIPE_THRESHOLD ? (
            <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
          ) : (
            <ArrowRight className="w-4 h-4 text-red-600 dark:text-red-400" />
          )}
        </div>
      </div>

      {/* Helper Text */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        {isDragging && dragProgress < SWIPE_THRESHOLD
          ? `Swipe ${Math.round((SWIPE_THRESHOLD - dragProgress) * 100)}% more to delete`
          : "Drag the slider to confirm deletion"}
      </p>
    </div>
  )
}
