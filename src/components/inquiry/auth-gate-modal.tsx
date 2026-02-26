import { Link } from 'react-router-dom'
import { LogIn, UserPlus } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { User } from '@/types'

export interface AuthGateModalProps {
  isOpen: boolean
  onClose: () => void
  redirectTo?: string
  user: User | null
}

const DEFAULT_REDIRECT = '/inquiry'

export function AuthGateModal({
  isOpen,
  onClose,
  redirectTo = DEFAULT_REDIRECT,
  user,
}: AuthGateModalProps) {
  const returnPath = redirectTo || DEFAULT_REDIRECT
  const loginUrl = `/login?redirect=${encodeURIComponent(returnPath)}`
  const signUpUrl = `/login?redirect=${encodeURIComponent(returnPath)}&signup=1`

  if (user) return null

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="sm:max-w-md"
        aria-describedby="auth-gate-description"
        aria-labelledby="auth-gate-title"
      >
        <DialogHeader>
          <DialogTitle id="auth-gate-title" className="font-serif text-xl">
            Sign in to submit an inquiry
          </DialogTitle>
          <DialogDescription id="auth-gate-description">
            Create an account or sign in to request a stay. Your data is handled securely and we
            never share your information with third parties.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-6 flex flex-col gap-3">
          <Link to={loginUrl} onClick={onClose}>
            <Button
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
              size="lg"
            >
              <LogIn className="mr-2 h-5 w-5" aria-hidden />
              Sign In
            </Button>
          </Link>
          <Link to={signUpUrl} onClick={onClose}>
            <Button
              variant="outline"
              className="w-full border-accent/50 hover:bg-secondary hover:border-accent transition-all"
              size="lg"
            >
              <UserPlus className="mr-2 h-5 w-5" aria-hidden />
              Create Account
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          By continuing, you agree to our Privacy Policy and Terms of Service.
        </p>
      </DialogContent>
    </Dialog>
  )
}
