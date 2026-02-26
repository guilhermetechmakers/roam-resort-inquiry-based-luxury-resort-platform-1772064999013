/**
 * GenericLoadingSuccessPanel - Reusable transient UI for loading or success states.
 * Pluggable into inquiry submission, payment links, data export, uploads, etc.
 * Roam Resort design system: navy, beige, bronze-gold accents.
 */
import * as React from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Spinner } from './spinner'
import { CheckmarkGraphic } from './checkmark-graphic'

export interface PrimaryAction {
  label: string
  onClick: () => void
  ariaLabel?: string
}

export interface SecondaryAction {
  label: string
  onClick: () => void
  variant?: 'text' | 'outline' | 'soft'
}

export interface GenericLoadingSuccessPanelProps {
  status: 'loading' | 'success'
  title?: string
  subtitle?: string
  primaryAction?: PrimaryAction
  secondaryActions?: SecondaryAction[]
  allowBackdropClose?: boolean
  image?: React.ReactNode | string
  dataPayload?: unknown
  /** Layout: overlay (modal with backdrop) or full-page (centered section) */
  variant?: 'overlay' | 'full-page'
  onBackdropClick?: () => void
  /** Optional progress 0-100 for loading state; shows inline progress bar when set */
  progress?: number
}

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

function useFocusTrap(containerRef: React.RefObject<HTMLElement | null>, isActive: boolean) {
  React.useEffect(() => {
    if (!isActive || !containerRef.current) return

    const el = containerRef.current
    const focusables = Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
    const first = focusables[0]
    const last = focusables[focusables.length - 1]

    if (first) first.focus()

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab') return
      if (focusables.length <= 1) return

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last?.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first?.focus()
        }
      }
    }

    el.addEventListener('keydown', handleKeyDown)
    return () => el.removeEventListener('keydown', handleKeyDown)
  }, [isActive, containerRef])
}

export function GenericLoadingSuccessPanel({
  status,
  title,
  subtitle,
  primaryAction,
  secondaryActions = [],
  allowBackdropClose = false,
  image,
  variant = 'overlay',
  onBackdropClick,
  progress,
}: GenericLoadingSuccessPanelProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const isOverlay = variant === 'overlay'
  useFocusTrap(containerRef, isOverlay)

  const safeSecondaryActions = Array.isArray(secondaryActions) ? secondaryActions : []

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (!allowBackdropClose) return
    if (e.target === e.currentTarget) {
      onBackdropClick?.()
    }
  }

  React.useEffect(() => {
    if (!isOverlay || !allowBackdropClose) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onBackdropClick?.()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOverlay, allowBackdropClose, onBackdropClick])

  React.useEffect(() => {
    if (!isOverlay) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOverlay])

  const content = (
    <div
      ref={containerRef}
      role={status === 'loading' ? 'status' : 'alert'}
      aria-live={status === 'loading' ? 'polite' : 'assertive'}
      aria-label={status === 'loading' ? 'Loading' : 'Success'}
      tabIndex={isOverlay ? -1 : undefined}
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'rounded-xl border border-border bg-card p-8 sm:p-10',
        'shadow-card max-w-md w-full mx-4',
        'animate-fade-in-up'
      )}
    >
      {image && (
        <div className="mb-6 flex justify-center">
          {typeof image === 'string' ? (
            <img
              src={image}
              alt=""
              className="h-24 w-24 rounded-lg object-cover"
              aria-hidden
            />
          ) : (
            image
          )}
        </div>
      )}

      {status === 'loading' && (
        <>
          <Spinner size="lg" aria-label="Processing" className="mb-6" />
          <h2 className="font-serif text-2xl font-semibold text-foreground">
            {title ?? 'Loading…'}
          </h2>
          {subtitle && (
            <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>
          )}
          {typeof progress === 'number' && (
            <div
              className="mt-4 w-full max-w-[200px] rounded-full bg-secondary/50 h-2 overflow-hidden"
              role="progressbar"
              aria-valuenow={Math.min(100, Math.max(0, progress))}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-accent transition-all duration-300 ease-out rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
              />
            </div>
          )}
        </>
      )}

      {status === 'success' && (
        <>
          <CheckmarkGraphic size="lg" className="mb-6" />
          <h2 className="font-serif text-2xl font-semibold text-foreground">
            {title ?? 'Done'}
          </h2>
          {subtitle && (
            <p className="mt-3 text-sm text-muted-foreground">{subtitle}</p>
          )}
        </>
      )}

      <div className="mt-8 flex w-full flex-col gap-3 sm:flex-row sm:justify-center sm:gap-4">
        {primaryAction && (
          <Button
            onClick={primaryAction.onClick}
            aria-label={primaryAction.ariaLabel ?? primaryAction.label}
            className="w-full sm:w-auto"
          >
            {primaryAction.label}
          </Button>
        )}
        {(safeSecondaryActions ?? []).map((action, idx) => (
          <Button
            key={idx}
            variant={
              action.variant === 'outline'
                ? 'outline'
                : action.variant === 'soft'
                  ? 'secondary'
                  : 'ghost'
            }
            onClick={action.onClick}
            className="w-full sm:w-auto"
          >
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  )

  if (variant === 'full-page') {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16">
        {content}
      </div>
    )
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-primary/80 backdrop-blur-sm animate-fade-in"
      onClick={handleBackdropClick}
      role="presentation"
    >
      {content}
    </div>,
    document.body
  )
}
