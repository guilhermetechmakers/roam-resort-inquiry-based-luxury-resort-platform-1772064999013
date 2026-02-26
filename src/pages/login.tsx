import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { getRoleRedirectPath } from '@/lib/guards'
import { toUserMessage } from '@/lib/errors'
import {
  AuthTabs,
  RedirectHandler,
  SignUpSuccessCard,
} from '@/components/auth'
import type { AuthTab } from '@/components/auth/auth-tabs'
import type { LoginFormData, SignupFormData } from '@/lib/validation/auth-validation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const redirectParam = searchParams.get('redirect')
  const signupParam = searchParams.get('signup')

  const [activeTab, setActiveTab] = useState<AuthTab>(
    () => (signupParam === '1' ? 'signup' : 'login')
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ message: string; subMessage?: string } | null>(null)
  const [signupSuccess, setSignupSuccess] = useState<{
    email: string
    needsEmailVerification: boolean
  } | null>(null)
  const { signIn, signUp, user, isLoading } = useAuth()

  // Redirect authenticated users away from login
  const isAuthenticated = user != null && !isLoading
  if (isAuthenticated) {
    return (
      <>
        <RedirectHandler
          user={user}
          isLoading={false}
          redirectIfAuthenticated
          redirectTo={redirectParam}
        />
        <div className="flex min-h-[80vh] items-center justify-center">
          <p className="text-muted-foreground">Redirecting...</p>
        </div>
      </>
    )
  }

  const handleLogin = async (data: LoginFormData) => {
    setError(null)
    setLoading(true)
    try {
      const loggedInUser = await signIn(data.email, data.password)
      toast.success('Welcome back!')
      const path =
        redirectParam && redirectParam.startsWith('/') && !redirectParam.startsWith('//')
          ? redirectParam
          : getRoleRedirectPath(loggedInUser.role)
      navigate(path, { replace: true })
    } catch (err) {
      const userMsg = toUserMessage(err, 'Login failed')
      const isRateLimited = userMsg.toLowerCase().includes('too many attempts')
      setError({
        message: userMsg,
        subMessage: isRateLimited ? 'Please wait a few minutes before trying again.' : undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSignup = async (data: SignupFormData) => {
    setError(null)
    setLoading(true)
    try {
      const result = await signUp(data.email, data.password, data.name, data.role)
      setSignupSuccess({
        email: data.email,
        needsEmailVerification: result.needsEmailVerification ?? true,
      })
      toast.success('Account created. Check your email to verify.')
    } catch (err) {
      const userMsg = toUserMessage(err, 'Signup failed')
      const isRateLimited = userMsg.toLowerCase().includes('too many attempts')
      setError({
        message: userMsg,
        subMessage: isRateLimited
          ? 'Please wait a few minutes before trying again.'
          : userMsg.toLowerCase().includes('already exists')
            ? 'Try signing in instead.'
            : undefined,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => setError(null)

  return (
    <div className="relative min-h-[85vh] flex flex-col">
        {/* Hero background with gradient overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage: `url(https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920)`,
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/95 to-background" />

        <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-16">
          <div className="w-full max-w-md">
            <div className="text-center mb-8 animate-fade-in">
              <Link
                to="/"
                className="font-serif text-2xl font-semibold text-foreground hover:text-accent transition-colors"
              >
                Roam Resort
              </Link>
              <h1 className="mt-4 font-serif text-4xl font-bold tracking-tight sm:text-5xl">
                Welcome
              </h1>
              <p className="mt-3 text-muted-foreground text-lg">
                Sign in or create an account to submit stay inquiries.
              </p>
            </div>

            <Card
              className={cn(
                'border-border bg-card/95 backdrop-blur-sm shadow-card',
                'animate-fade-in-up'
              )}
            >
              <CardHeader className="pb-4">
                <CardTitle className="font-serif text-xl">
                  {signupSuccess ? 'Almost there' : 'Account'}
                </CardTitle>
                <CardDescription>
                  {signupSuccess
                    ? 'Verify your email to continue'
                    : 'Sign in or create an account'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {signupSuccess ? (
                  <SignUpSuccessCard
                    email={signupSuccess.email}
                    needsEmailVerification={signupSuccess.needsEmailVerification}
                  />
                ) : (
                  <AuthTabs
                    activeTab={activeTab}
                    onTabChange={setActiveTab}
                    onLogin={handleLogin}
                    onSignup={handleSignup}
                    isLoading={loading}
                    error={error}
                    onRetry={handleRetry}
                  />
                )}
              </CardContent>
            </Card>

            <p className="mt-6 text-center text-sm text-muted-foreground animate-fade-in">
              By signing in, you agree to our{' '}
              <Link to="/terms" className="text-accent hover:underline">
                Terms
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-accent hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
  )
}
