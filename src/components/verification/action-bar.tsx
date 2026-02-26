import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { getRoleRedirectPath } from '@/lib/guards'
import type { User } from '@/types'
import type { UserRole } from '@/types/auth'
import { cn } from '@/lib/utils'

export interface ActionBarProps {
  status: 'success' | 'error'
  user: User | null
  onResendClick?: () => void
  isResendLoading?: boolean
  className?: string
}

export function ActionBar({
  status,
  user,
  onResendClick,
  isResendLoading = false,
  className,
}: ActionBarProps) {
  const role = (user?.role ?? 'guest') as UserRole
  const redirectPath = getRoleRedirectPath(role)

  const primaryLabel =
    role === 'concierge'
      ? 'Go to Admin'
      : role === 'host'
        ? 'Go to Host Dashboard'
        : 'Explore Destinations'

  if (status === 'success') {
    return (
      <div
        className={cn('flex flex-col sm:flex-row gap-3 justify-center items-center', className)}
        role="group"
        aria-label="Post-verification actions"
      >
        <Button
          asChild
          className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground hover:scale-[1.02] active:scale-[0.98] transition-transform"
          size="lg"
        >
          <Link to={redirectPath}>{primaryLabel}</Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="w-full sm:w-auto border-accent text-accent hover:bg-accent/10"
          size="lg"
        >
          <Link to="/profile">Go to Profile</Link>
        </Button>
      </div>
    )
  }

  return (
    <div
      className={cn('flex flex-col sm:flex-row gap-3 justify-center items-center', className)}
      role="group"
      aria-label="Error recovery actions"
    >
      {onResendClick && (
        <Button
          onClick={onResendClick}
          disabled={isResendLoading}
          className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground hover:scale-[1.02] active:scale-[0.98] transition-transform"
          size="lg"
        >
          {isResendLoading ? 'Sending...' : 'Resend verification email'}
        </Button>
      )}
      <Link to="/login">
        <Button
          variant="outline"
          className="w-full sm:w-auto border-accent text-accent hover:bg-accent/10"
          size="lg"
        >
          Back to Login
        </Button>
      </Link>
    </div>
  )
}
