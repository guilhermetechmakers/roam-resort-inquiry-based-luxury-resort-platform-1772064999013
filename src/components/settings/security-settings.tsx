import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound, Shield, Monitor, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { changePasswordSchema, type ChangePasswordFormData } from '@/lib/validation/profile-validation'
import type { SettingsSession } from '@/types/settings'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

export interface SecuritySettingsProps {
  sessions: SettingsSession[]
  isLoadingSessions?: boolean
  passwordOpen?: boolean
  onPasswordOpenChange?: (open: boolean) => void
  onChangePassword?: (data: ChangePasswordFormData) => Promise<void>
  onLogoutOthers?: () => Promise<void>
}

export function SecuritySettings({
  sessions,
  isLoadingSessions = false,
  passwordOpen: controlledPasswordOpen,
  onPasswordOpenChange,
  onChangePassword,
  onLogoutOthers,
}: SecuritySettingsProps) {
  const [internalPasswordOpen, setInternalPasswordOpen] = useState(false)
  const passwordOpen = onPasswordOpenChange ? (controlledPasswordOpen ?? false) : internalPasswordOpen
  const setPasswordOpen = onPasswordOpenChange ?? setInternalPasswordOpen
  const [logoutOthersOpen, setLogoutOthersOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (passwordOpen) reset()
  }, [passwordOpen, reset])

  const handlePasswordSubmit = async (values: ChangePasswordFormData) => {
    await onChangePassword?.(values)
    reset()
    setPasswordOpen(false)
  }

  const otherSessions = (sessions ?? []).filter((s) => !s.isCurrent)
  const hasOtherSessions = otherSessions.length > 0

  return (
    <>
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-card-hover">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            <h3 className="font-serif text-xl font-semibold">Security</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Password, sessions, and account security
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Button
              variant="outline"
              className="gap-2 border-accent/30 hover:border-accent hover:bg-accent/10"
              onClick={() => setPasswordOpen(true)}
            >
              <KeyRound className="h-4 w-4" />
              Change password
            </Button>
          </div>

          <div>
            <h4 className="mb-3 flex items-center gap-2 font-medium">
              <Monitor className="h-4 w-4" />
              Active sessions
            </h4>
            {isLoadingSessions ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : (
              <div className="space-y-2">
                {(sessions ?? []).map((s) => (
                  <div
                    key={s.id}
                    className={cn(
                      'flex items-center justify-between rounded-lg border p-3',
                      s.isCurrent ? 'border-accent/30 bg-accent/5' : 'border-border'
                    )}
                  >
                    <div>
                      <p className="font-medium">{s.device ?? 'Unknown device'}</p>
                      <p className="text-sm text-muted-foreground">
                        Last active: {formatDateTime(s.lastActive)}
                        {s.isCurrent && (
                          <span className="ml-2 text-accent">(current)</span>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
                {hasOtherSessions && onLogoutOthers && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-destructive"
                    onClick={() => setLogoutOthersOpen(true)}
                  >
                    <LogOut className="h-4 w-4" />
                    Log out other devices
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby="change-password-desc">
          <DialogHeader>
            <DialogTitle>Change password</DialogTitle>
            <p id="change-password-desc" className="sr-only">
              Enter current password and new password
            </p>
          </DialogHeader>
          <form onSubmit={handleSubmit(handlePasswordSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="current-password">Current password</Label>
              <Input
                id="current-password"
                type="password"
                {...register('currentPassword')}
                autoComplete="current-password"
                className={cn(errors.currentPassword && 'border-destructive')}
              />
              {errors.currentPassword && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.currentPassword.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                type="password"
                {...register('newPassword')}
                autoComplete="new-password"
                className={cn(errors.newPassword && 'border-destructive')}
              />
              {errors.newPassword && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.newPassword.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirm new password</Label>
              <Input
                id="confirm-password"
                type="password"
                {...register('confirmPassword')}
                autoComplete="new-password"
                className={cn(errors.confirmPassword && 'border-destructive')}
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-destructive">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setPasswordOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={logoutOthersOpen} onOpenChange={setLogoutOthersOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out other devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out of all other devices. You will remain signed in on this device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                await onLogoutOthers?.()
                setLogoutOthersOpen(false)
              }}
            >
              Log out others
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
