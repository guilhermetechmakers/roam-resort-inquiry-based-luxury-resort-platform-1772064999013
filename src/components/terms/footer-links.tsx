import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { FooterLink } from '@/types/terms'

export interface FooterLinksProps {
  links: FooterLink[]
  lastUpdated?: string
  className?: string
}

export function FooterLinks({
  links = [],
  lastUpdated = '',
  className,
}: FooterLinksProps) {
  const safeLinks = Array.isArray(links) ? links : []

  return (
    <footer
      className={cn(
        'border-t border-border bg-secondary/30 py-12',
        className
      )}
      role="contentinfo"
      aria-label="Terms page footer"
    >
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <nav
          className="flex flex-wrap justify-center gap-x-6 gap-y-2"
          aria-label="Legal and privacy links"
        >
          {safeLinks.map((link) => (
            <Link
              key={`${link.href}-${link.text}`}
              to={link.href}
              className="text-sm font-medium text-accent hover:text-accent/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded"
            >
              {link.text}
            </Link>
          ))}
        </nav>
        {lastUpdated ? (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            Last updated: {lastUpdated}
          </p>
        ) : null}
      </div>
    </footer>
  )
}
