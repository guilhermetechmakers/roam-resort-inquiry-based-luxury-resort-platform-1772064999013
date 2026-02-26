import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'
import type { LegalLink } from '@/types/about-help'

export interface LegalLinksRowProps {
  links?: LegalLink[] | null
  className?: string
}

const DEFAULT_LINKS: LegalLink[] = [
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Terms of Service', href: '/terms' },
  { label: 'Cookie Policy', href: '/cookie-policy' },
]

export function LegalLinksRow({ links, className }: LegalLinksRowProps) {
  const linkItems = Array.isArray(links) && links.length > 0 ? links : DEFAULT_LINKS

  return (
    <nav
      className={cn('py-8', className)}
      aria-label="Legal and policy links"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
          {linkItems.map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="text-sm font-medium text-muted-foreground hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded transition-colors duration-200"
            >
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}
