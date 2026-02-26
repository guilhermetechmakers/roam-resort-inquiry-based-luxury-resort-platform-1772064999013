import { Link } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface PrivacyLinkBlockProps {
  label: string
  href: string
  tier?: 'primary' | 'ghost'
  className?: string
}

export function PrivacyLinkBlock({
  label,
  href,
  tier = 'primary',
  className,
}: PrivacyLinkBlockProps) {
  const isExternal = href.startsWith('http')
  const safeHref = href ?? '/privacy'

  const content = (
    <>
      <Shield className="h-5 w-5" aria-hidden />
      {label}
    </>
  )

  const baseClasses =
    'inline-flex items-center gap-2 transition-all duration-200 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

  if (tier === 'primary') {
    return (
      <Button
        variant="default"
        className={cn(baseClasses, 'bg-accent text-accent-foreground shadow-accent-glow', className)}
        asChild
      >
        <Link
          to={safeHref}
          aria-label={label}
          {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {content}
        </Link>
      </Button>
    )
  }

  return (
    <Link
      to={safeHref}
      className={cn(
        baseClasses,
        'rounded-md border border-accent/50 bg-secondary/50 px-4 py-2 text-accent hover:bg-accent/10 hover:border-accent',
        className
      )}
      aria-label={label}
      {...(isExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {content}
    </Link>
  )
}
