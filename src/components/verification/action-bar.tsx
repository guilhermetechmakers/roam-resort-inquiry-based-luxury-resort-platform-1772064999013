import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { getRoleRedirectPath } from '@/lib/guards'
import type { User } from '@/types'
import type { UserRole } from '@/types/auth'
import { cn } from '@/lib/utils'

const AUTO_REDIRECT_DELAY_MS = 5000

export interface ActionBarProps {
  status: 'success' | 'error'
  user: User | null
  onResendClick?: () => void
  isResendLoading?: boolean
  /** If true, auto-redirect to role path after delay on success */
  autoRedirect?: boolean
  className?: string
}

export function ActionBar({
  status,
  user,
  onResendClick,
  isResendLoading = false,
  autoRedirect = true,
  className,
}: ActionBarProps) {
  const navigate = useNavigate()
  const [countdown, setCountdown] = useState<number | null>(null)
  const role = (user?.role ?? 'guest') as UserRole
  const redirectPath = getRoleRedirectPath(role)

  useEffect(() => {
    if (status === 'success' && autoRedirect && redirectPath) {
      queueMicrotask(() => setCountdown(Math.ceil(AUTO_REDIRECT_DELAY_MS / 1000)))
      const t = setTimeout(() => navigate(redirectPath, { replace: true }), AUTO_REDIRECT_DELAY_MS)
      return () => clearTimeout(t)
    } else {
      queueMicrotask(() => setCountdown(null))
    }
  }, [status, autoRedirect, redirectPath, navigate])

  useEffect(() => {
    if (countdown == null || countdown <= 0) return
    const i = setInterval(() => setCountdown((c) => (c != null && c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(i)
  }, [countdown])

  const primaryLabel =
    role === 'concierge'
      ? 'Go to Admin'
      : role === 'host'
        ? 'Go to Host Dashboard'
        : 'Explore Destinations'

  if (status === 'success') {
    return (
      <div
        className={cn('flex flex-col gap-4', className)}
        role="group"
        aria-label="Post-verification actions"
      >
        <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
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
        {countdown != null && countdown > 0 && (
          <p className="text-center text-sm text-muted-foreground" aria-live="polite">
            Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
          </p>
        )}
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
