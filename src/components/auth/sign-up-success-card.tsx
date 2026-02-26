import { Link } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export interface SignUpSuccessCardProps {
  email?: string
  needsEmailVerification?: boolean
  className?: string
}

export function SignUpSuccessCard({
  email,
  needsEmailVerification = true,
  className,
}: SignUpSuccessCardProps) {
  return (
    <Card
      className={cn(
        'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30 animate-fade-in',
        className
      )}
    >
      <CardHeader className="text-center pb-2">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
          <CheckCircle2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <h3 className="font-serif text-xl font-semibold text-foreground">
          Account created
        </h3>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        {needsEmailVerification ? (
          <>
            <p className="text-sm text-muted-foreground">
              We've sent a verification link to{' '}
              {email ? (
                <span className="font-medium text-foreground">{email}</span>
              ) : (
                'your email'
              )}
              . Please check your inbox and click the link to verify your
              account.
            </p>
            <p className="text-xs text-muted-foreground">
              You can sign in after verifying. Check your spam folder if you
              don't see the email.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            Your account is ready. You can now sign in and start exploring.
          </p>
        )}
        <Link to="/login">
          <Button className="w-full sm:w-auto mt-2">
            Continue to sign in
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
