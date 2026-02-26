import * as React from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { HelpCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface HelpTooltipProps {
  content: React.ReactNode
  /** Optional trigger element; defaults to HelpCircle icon */
  trigger?: React.ReactNode
  /** Side for tooltip placement */
  side?: 'top' | 'right' | 'bottom' | 'left'
  className?: string
}

/** Accessible tooltip for contextual guidance */
export function HelpTooltip({
  content,
  trigger,
  side = 'top',
  className,
}: HelpTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              'inline-flex items-center justify-center rounded-full p-0.5 text-muted-foreground',
              'hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
              'transition-colors',
              className
            )}
            aria-label="Help"
          >
            {trigger ?? <HelpCircle className="h-4 w-4" />}
          </button>
        </TooltipTrigger>
        <TooltipContent side={side} className="max-w-xs">
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export interface GuidanceInlineProps {
  title?: string
  children: React.ReactNode
  defaultOpen?: boolean
  /** Alias for defaultOpen: when true, block starts collapsed */
  defaultCollapsed?: boolean
  className?: string
}

/** Collapsible guidance block */
export function GuidanceInline({
  title = 'Privacy rights',
  children,
  defaultOpen,
  defaultCollapsed,
  className,
}: GuidanceInlineProps) {
  const startsOpen = defaultCollapsed !== undefined ? !defaultCollapsed : (defaultOpen ?? false)
  const [open, setOpen] = React.useState(startsOpen)
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-muted/30 p-4',
        className
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left text-sm font-medium text-foreground hover:text-accent transition-colors"
        aria-expanded={open}
      >
        {title}
        <span className="text-muted-foreground">{open ? '−' : '+'}</span>
      </button>
      {open && (
        <div className="mt-3 text-sm text-muted-foreground animate-fade-in">
          {children}
        </div>
      )}
    </div>
  )
}
