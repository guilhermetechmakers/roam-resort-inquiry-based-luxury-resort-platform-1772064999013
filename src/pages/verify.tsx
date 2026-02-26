import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useVerifyToken } from '@/hooks/use-verify-token'
import { useResendVerification } from '@/hooks/use-resend-verification'
import {
  TokenStatusCard,
  ActionBar,
  ResendVerificationModal,
} from '@/components/verification'

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920'

export function VerifyPage() {
  const {
    verificationStatus,
    errorMessage,
    user,
  } = useVerifyToken()
  const { resend, isLoading: isResendLoading } = useResendVerification()
  const [showResendModal, setShowResendModal] = useState(false)

  const handleResendClick = () => {
    if (user?.email) {
      resend(user.email).then((result) => {
        if (result.success) {
          toast.success('Verification email resent. Check your inbox.')
        } else {
          toast.error(result.error ?? 'Failed to resend')
        }
      })
    } else {
      setShowResendModal(true)
    }
  }

  const handleResendSubmit = async (
    email: string
  ): Promise<{ success: boolean; error?: string }> => {
    return resend(email)
  }

  const status = verificationStatus === 'loading' ? 'loading' : verificationStatus === 'success' ? 'success' : 'error'

  return (
    <div className="relative min-h-[85vh] flex flex-col">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-30"
        style={{ backgroundImage: `url(${HERO_IMAGE})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background" />

      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg space-y-6 animate-fade-in-up">
          <div className="text-center">
            <Link
              to="/"
              className="font-serif text-2xl font-semibold text-foreground hover:text-accent transition-colors"
            >
              Roam Resort
            </Link>
          </div>

          <TokenStatusCard
            status={status}
            message={
              verificationStatus === 'loading'
                ? 'Verifying...'
                : verificationStatus === 'success'
                  ? 'Your email has been verified'
                  : 'Verification failed'
            }
            detail={
              verificationStatus === 'success'
                ? 'Welcome to Roam Resort. You can now explore our destinations and submit inquiries.'
                : verificationStatus === 'error'
                  ? errorMessage ?? 'Verification link is invalid or has expired. You can request a new one below.'
                  : undefined
            }
          />

          <div className="flex flex-col gap-4">
            {verificationStatus === 'success' && (
              <ActionBar
                status="success"
                user={user ?? null}
              />
            )}
            {verificationStatus === 'error' && (
              <>
                <ActionBar
                  status="error"
                  user={user ?? null}
                  onResendClick={handleResendClick}
                  isResendLoading={isResendLoading}
                />
                <p className="text-center text-sm text-muted-foreground">
                  Didn&apos;t receive the email?{' '}
                  <button
                    type="button"
                    onClick={() => setShowResendModal(true)}
                    className="text-accent hover:underline font-medium focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded"
                  >
                    Resend verification email
                  </button>
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <ResendVerificationModal
        open={showResendModal}
        onOpenChange={setShowResendModal}
        defaultEmail={user?.email ?? ''}
        onSubmit={handleResendSubmit}
      />
    </div>
  )
}
