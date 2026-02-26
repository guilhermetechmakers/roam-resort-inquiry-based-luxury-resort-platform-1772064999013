/**
 * BrandHeader - Top header with brand feel and context indicator.
 */

import { Link } from 'react-router-dom'

export interface BrandHeaderProps {
  reference?: string
  destinationName?: string
}

export function BrandHeader({ reference, destinationName }: BrandHeaderProps) {
  const ref = reference ?? ''
  const dest = destinationName ?? 'Destination'

  return (
    <header className="border-b border-border/50 bg-card/30 backdrop-blur-sm">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="font-serif text-xl font-semibold text-foreground transition-colors hover:text-accent"
          aria-label="Roam Resort home"
        >
          Roam Resort
        </Link>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {ref && (
            <span className="font-mono" aria-label="Inquiry reference">
              {ref}
            </span>
          )}
          {dest && ref && (
            <span className="hidden sm:inline" aria-hidden>
              ·
            </span>
          )}
          {dest && (
            <span className="hidden sm:inline truncate max-w-[120px]" title={dest}>
              {dest}
            </span>
          )}
        </div>
      </div>
    </header>
  )
}
