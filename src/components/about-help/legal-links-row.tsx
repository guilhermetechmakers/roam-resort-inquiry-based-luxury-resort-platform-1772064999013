import { Link } from 'react-router-dom'
import { FileText, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import type { LegalLink } from '@/types/about-help'

export interface LegalLinksRowProps {
  links?: LegalLink[] | null
  isLoading?: boolean
  error?: string | null
  className?: string
}

const DEFAULT_LINKS: LegalLink[] = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Cookie Policy', href: '/cookie-policy' },
]

export function LegalLinksRow({
  links,
  isLoading = false,
  error = null,
  className,
}: LegalLinksRowProps) {
  const linkItems =
    Array.isArray(links) && links.length > 0 ? links : undefined
  const useDefaults = linkItems === undefined && !isLoading && !error
  const displayLinks = linkItems ?? (useDefaults ? DEFAULT_LINKS : [])
  const isEmpty = Array.isArray(links) && links.length === 0

  if (isLoading) {
    return (
      <nav
        className={cn('py-8', className)}
        aria-label="Legal and policy links"
        aria-busy="true"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
            {[1, 2, 3].map((i) => (
              <Skeleton
                key={i}
                className="h-5 w-24 rounded-md"
                aria-hidden
              />
            ))}
          </div>
        </div>
      </nav>
    )
  }

  if (error) {
    return (
      <nav
        className={cn('py-8', className)}
        aria-label="Legal and policy links"
        role="alert"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" aria-hidden />
            </div>
            <p className="text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </nav>
    )
  }

  if (isEmpty) {
    return (
      <nav
        className={cn('py-8', className)}
        aria-label="Legal and policy links"
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-secondary/30">
              <FileText
                className="h-6 w-6 text-muted-foreground"
                aria-hidden
              />
            </div>
            <h4 className="font-serif text-sm font-medium text-foreground">
              No legal links available
            </h4>
            <p className="max-w-xs text-xs text-muted-foreground leading-relaxed">
              Legal and policy links will appear here when available.
            </p>
          </div>
        </div>
      </nav>
    )
  }

  return (
    <nav
      className={cn('py-8', className)}
      aria-label="Legal and policy links"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 md:gap-8">
          {(displayLinks ?? []).map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className={cn(
                'text-sm font-medium text-muted-foreground',
                'rounded-md px-2 py-1.5 transition-all duration-200',
                'hover:text-accent hover:scale-[1.02] active:scale-[0.98]',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background'
              )}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
