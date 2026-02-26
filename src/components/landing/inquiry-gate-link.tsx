import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { CTAButton } from './cta-button'

export interface InquiryGateLinkProps {
  destinationSlug?: string
  label?: string
  variant?: 'primary' | 'secondary'
  className?: string
  children?: React.ReactNode
}

/**
 * Routes to login if unauthenticated, else to inquiry form or destinations.
 * If destinationSlug provided and authenticated: /destinations/:slug/inquire
 * Otherwise: /destinations (to pick a destination)
 */
export function InquiryGateLink({
  destinationSlug,
  label = 'Request a Stay',
  variant = 'primary',
  className,
  children,
}: InquiryGateLinkProps) {
  const { isAuthenticated } = useAuth()

  const redirectPath = destinationSlug
    ? `/destinations/${destinationSlug}/inquire`
    : '/destinations'
  const loginRedirect = encodeURIComponent(redirectPath)

  const to = !isAuthenticated ? `/login?redirect=${loginRedirect}` : redirectPath
  const content =
    children ?? (
      <CTAButton variant={variant} asChild>
        <Link to={to} className="inline-flex items-center">
          {label}
        </Link>
      </CTAButton>
    )
  return (
    <span className={className} aria-label={label}>
      {content}
    </span>
  )
}
