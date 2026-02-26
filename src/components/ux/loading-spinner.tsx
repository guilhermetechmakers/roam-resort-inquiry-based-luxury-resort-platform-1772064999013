/**
 * Global loading indicator and per-section spinners.
 * Debounce-friendly: can delay visibility for short operations.
 */

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  /** Delay before showing (ms) - avoids flash for fast operations */
  delayMs?: number
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-10 w-10',
}

export function LoadingSpinner({
  size = 'md',
  className,
  delayMs = 0,
}: LoadingSpinnerProps) {
  const [visible, setVisible] = useState(delayMs === 0)

  useEffect(() => {
    if (delayMs <= 0) {
      setVisible(true)
      return
    }
    const t = setTimeout(() => setVisible(true), delayMs)
    return () => clearTimeout(t)
  }, [delayMs])

  if (!visible) return null

  return (
    <Loader2
      className={cn('animate-spin text-accent', sizeClasses[size], className)}
      aria-hidden
    />
  )
}

export interface GlobalLoadingBarProps {
  isLoading: boolean
  /** Delay before showing bar (ms) */
  delayMs?: number
  className?: string
}

/** Thin progress bar for global loading state */
export function GlobalLoadingBar({
  isLoading,
  delayMs = 200,
  className,
}: GlobalLoadingBarProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isLoading) {
      setShow(false)
      return
    }
    const t = setTimeout(() => setShow(true), delayMs)
    return () => clearTimeout(t)
  }, [isLoading, delayMs])

  if (!show || !isLoading) return null

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={undefined}
      aria-label="Loading"
      className={cn(
        'fixed left-0 right-0 top-0 z-[9999] h-1 bg-accent/30 overflow-hidden',
        className
      )}
    >
      <div className="h-full w-1/3 animate-loading-bar rounded-r bg-accent" />
    </div>
  )
}
