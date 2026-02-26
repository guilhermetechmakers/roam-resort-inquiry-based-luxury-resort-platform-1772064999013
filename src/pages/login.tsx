import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/auth-context'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
})

const signupSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  fullName: z.string().optional(),
})

type LoginForm = z.infer<typeof loginSchema>
type SignupForm = z.infer<typeof signupSchema>

export function LoginPage() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { signIn, signUp } = useAuth()

  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const signupForm = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: '', password: '', fullName: '' },
  })

  const onLogin = async (data: LoginForm) => {
    setLoading(true)
    try {
      await signIn(data.email, data.password)
      toast.success('Welcome back!')
      navigate('/profile')
    } catch (err) {
      toast.error((err as Error).message ?? 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const onSignup = async (data: SignupForm) => {
    setLoading(true)
    try {
      await signUp(data.email, data.password, data.fullName)
      toast.success('Check your email to verify your account.')
      navigate('/profile')
    } catch (err) {
      toast.error((err as Error).message ?? 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-serif text-2xl font-semibold">
            Roam Resort
          </Link>
          <h1 className="mt-4 font-serif text-3xl font-bold">Welcome</h1>
          <p className="mt-2 text-muted-foreground">
            Sign in or create an account to submit stay inquiries.
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="signup">Sign Up</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <form
              onSubmit={loginForm.handleSubmit(onLogin)}
              className="mt-6 space-y-4"
            >
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  className="mt-2"
                  {...loginForm.register('email')}
                />
                {loginForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-destructive">
                    {loginForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  className="mt-2"
                  {...loginForm.register('password')}
                />
                {loginForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-destructive">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
                <Link
                  to="/forgot-password"
                  className="mt-2 block text-sm text-accent hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>
          </TabsContent>
          <TabsContent value="signup">
            <form
              onSubmit={signupForm.handleSubmit(onSignup)}
              className="mt-6 space-y-4"
            >
              <div>
                <Label htmlFor="signup-fullName">Full Name (optional)</Label>
                <Input
                  id="signup-fullName"
                  placeholder="Jane Doe"
                  className="mt-2"
                  {...signupForm.register('fullName')}
                />
              </div>
              <div>
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  className="mt-2"
                  {...signupForm.register('email')}
                />
                {signupForm.formState.errors.email && (
                  <p className="mt-1 text-sm text-destructive">
                    {signupForm.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="Min 8 characters"
                  className="mt-2"
                  {...signupForm.register('password')}
                />
                {signupForm.formState.errors.password && (
                  <p className="mt-1 text-sm text-destructive">
                    {signupForm.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <p className="mt-6 text-center text-sm text-muted-foreground">
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
  )
}
