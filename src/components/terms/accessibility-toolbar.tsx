import { useState } from 'react'
import { cn } from '@/lib/utils'

export interface AccessibilityToolbarProps {
  className?: string
  contentId?: string
}

export function AccessibilityToolbar({ className, contentId = 'terms-main-content' }: AccessibilityToolbarProps) {
  const [fontSize, setFontSize] = useState<'base' | 'large' | 'xlarge'>('base')
  const [highContrast, setHighContrast] = useState(false)

  const handleSkipToContent = () => {
    const main = document.getElementById(contentId)
    main?.focus({ preventScroll: false })
    ;(main as HTMLElement)?.scrollIntoView?.({ behavior: 'smooth' })
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 py-2',
        className
      )}
      role="toolbar"
      aria-label="Accessibility options"
    >
      <a
        href={`#${contentId}`}
        onClick={(e) => {
          e.preventDefault()
          handleSkipToContent()
        }}
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Skip to content
      </a>
      <div className="flex items-center gap-1" role="group" aria-label="Font size">
        <span className="text-xs text-muted-foreground">A</span>
        {(['base', 'large', 'xlarge'] as const).map((size) => (
          <button
            key={size}
            type="button"
            onClick={() => setFontSize(size)}
            className={cn(
              'rounded px-2 py-1 text-xs font-medium transition-colors',
              fontSize === size
                ? 'bg-accent text-accent-foreground'
                : 'bg-secondary/50 text-foreground hover:bg-secondary'
            )}
            aria-pressed={fontSize === size}
            aria-label={`Font size: ${size}`}
          >
            {size === 'base' ? 'A' : size === 'large' ? 'A+' : 'A++'}
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setHighContrast(!highContrast)}
        className={cn(
          'rounded px-2 py-1 text-xs font-medium transition-colors',
          highContrast
            ? 'bg-accent text-accent-foreground'
            : 'bg-secondary/50 text-foreground hover:bg-secondary'
        )}
        aria-pressed={highContrast}
        aria-label="Toggle high contrast"
      >
        High contrast
      </button>
      <div
        data-font-size={fontSize}
        data-high-contrast={highContrast}
        className="contents"
        aria-hidden
      />
    </div>
  )
}
