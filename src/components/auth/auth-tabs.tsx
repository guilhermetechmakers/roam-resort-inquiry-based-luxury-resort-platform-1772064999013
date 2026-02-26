import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { AuthForm } from '@/components/auth/auth-form'
import { ErrorBanner } from '@/components/auth/error-banner'
import { SocialAuthPlaceholders } from '@/components/auth/social-auth-placeholders'
import type { LoginFormData, SignupFormData } from '@/lib/validation/auth-validation'
import { cn } from '@/lib/utils'

export type AuthTab = 'login' | 'signup'

export interface AuthTabsProps {
  activeTab: AuthTab
  onTabChange: (tab: AuthTab) => void
  onLogin: (data: LoginFormData) => Promise<void>
  onSignup: (data: SignupFormData) => Promise<void>
  isLoading?: boolean
  error?: { message: string; subMessage?: string } | null
  onRetry?: () => void
  onForgotPassword?: () => void
  initialEmail?: string
  className?: string
}

export function AuthTabs({
  activeTab,
  onTabChange,
  onLogin,
  onSignup,
  isLoading = false,
  error = null,
  onRetry,
  onForgotPassword,
  initialEmail = '',
  className,
}: AuthTabsProps) {
  const handleSubmit = async (data: LoginFormData | SignupFormData) => {
    if (activeTab === 'login') {
      await onLogin(data as LoginFormData)
    } else {
      await onSignup(data as SignupFormData)
    }
  }

  return (
    <div className={cn('space-y-6', className)}>
      {error && (
        <ErrorBanner
          message={error.message}
          subMessage={error.subMessage}
          onRetry={onRetry}
        />
      )}

      <Tabs
        value={activeTab}
        onValueChange={(v) => onTabChange(v as AuthTab)}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger value="login" className="text-base">
            Login
          </TabsTrigger>
          <TabsTrigger value="signup" className="text-base">
            Sign Up
          </TabsTrigger>
        </TabsList>
        <TabsContent value="login" className="mt-6">
          <AuthForm
            mode="login"
            onSubmit={handleSubmit}
            isLoading={isLoading}
            onForgotPassword={onForgotPassword}
            initialEmail={initialEmail}
          />
        </TabsContent>
        <TabsContent value="signup" className="mt-6">
          <AuthForm
            mode="signup"
            onSubmit={handleSubmit}
            isLoading={isLoading}
            initialEmail={initialEmail}
          />
        </TabsContent>
      </Tabs>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-card px-2 text-muted-foreground">
            or continue with
          </span>
        </div>
      </div>

      <SocialAuthPlaceholders disabled />
    </div>
  )
}
