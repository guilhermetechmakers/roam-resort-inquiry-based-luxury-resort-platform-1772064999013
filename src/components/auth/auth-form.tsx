import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter'
import {
  loginSchema,
  signupSchema,
  type LoginFormData,
  type SignupFormData,
} from '@/lib/validation/auth-validation'

export type AuthFormMode = 'login' | 'signup'

export interface AuthFormProps {
  mode: AuthFormMode
  onSubmit: (data: LoginFormData | SignupFormData) => Promise<void>
  isLoading?: boolean
  onForgotPassword?: () => void
  initialEmail?: string
}

export function AuthForm({
  mode,
  onSubmit,
  isLoading = false,
  onForgotPassword,
  initialEmail = '',
}: AuthFormProps) {
  const isLogin = mode === 'login'

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: initialEmail,
      password: '',
      rememberMe: false,
    },
  })

  const signupForm = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: initialEmail,
      password: '',
      confirmPassword: '',
    },
  })

  const form = isLogin ? loginForm : signupForm

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit(data as LoginFormData | SignupFormData)
  })

  if (isLogin) {
    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="login-email">Email</Label>
          <Input
            id="login-email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            className="mt-2"
            disabled={isLoading}
            {...loginForm.register('email')}
          />
          {loginForm.formState.errors.email && (
            <p className="mt-1 text-sm text-destructive" role="alert">
              {loginForm.formState.errors.email.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="login-password">Password</Label>
          <Input
            id="login-password"
            type="password"
            placeholder="••••••••"
            autoComplete="current-password"
            className="mt-2"
            disabled={isLoading}
            {...loginForm.register('password')}
          />
          {loginForm.formState.errors.password && (
            <p className="mt-1 text-sm text-destructive" role="alert">
              {loginForm.formState.errors.password.message}
            </p>
          )}
          <div className="mt-2 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={loginForm.watch('rememberMe')}
                onCheckedChange={(checked) =>
                  loginForm.setValue('rememberMe', !!checked)
                }
                disabled={isLoading}
                aria-label="Remember me"
              />
              <span className="text-sm text-muted-foreground">
                Remember me
              </span>
            </label>
            {onForgotPassword ? (
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
              >
                Forgot password?
              </button>
            ) : (
              <Link
                to="/forgot-password"
                className="text-sm text-accent hover:underline"
              >
                Forgot password?
              </Link>
            )}
          </div>
        </div>
        <Button
          type="submit"
          className="w-full"
          disabled={isLoading}
          aria-busy={isLoading}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="signup-name">Name</Label>
        <Input
          id="signup-name"
          type="text"
          placeholder="Jane Doe"
          autoComplete="name"
          className="mt-2"
          disabled={isLoading}
          {...signupForm.register('name')}
        />
        {signupForm.formState.errors.name && (
          <p className="mt-1 text-sm text-destructive" role="alert">
            {signupForm.formState.errors.name.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="signup-email">Email</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          className="mt-2"
          disabled={isLoading}
          {...signupForm.register('email')}
        />
        {signupForm.formState.errors.email && (
          <p className="mt-1 text-sm text-destructive" role="alert">
            {signupForm.formState.errors.email.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="signup-password">Password</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="Min 8 characters, mixed case, numbers, symbols"
          autoComplete="new-password"
          className="mt-2"
          disabled={isLoading}
          {...signupForm.register('password')}
        />
        <PasswordStrengthMeter
          password={signupForm.watch('password') ?? ''}
          className="mt-2"
        />
        {signupForm.formState.errors.password && (
          <p className="mt-1 text-sm text-destructive" role="alert">
            {signupForm.formState.errors.password.message}
          </p>
        )}
      </div>
      <div>
        <Label htmlFor="signup-confirm">Confirm password</Label>
        <Input
          id="signup-confirm"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          className="mt-2"
          disabled={isLoading}
          {...signupForm.register('confirmPassword')}
        />
        {signupForm.formState.errors.confirmPassword && (
          <p className="mt-1 text-sm text-destructive" role="alert">
            {signupForm.formState.errors.confirmPassword.message}
          </p>
        )}
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
        aria-busy={isLoading}
      >
        {isLoading ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  )
}
