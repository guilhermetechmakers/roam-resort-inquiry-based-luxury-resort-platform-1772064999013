import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { KeyRound, Shield, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  changePasswordSchema,
  type ChangePasswordFormValues,
} from '@/lib/validation/profile-validation'

export interface AccountSecurityActionsProps {
  openPasswordDialog?: boolean
  onOpenPasswordDialogChange?: (open: boolean) => void
  onChangePassword?: (values: ChangePasswordFormValues) => Promise<void>
  onRequestAccountDeletion?: () => void
  className?: string
}

export function AccountSecurityActions({
  openPasswordDialog = false,
  onOpenPasswordDialogChange,
  onChangePassword,
  onRequestAccountDeletion,
  className,
}: AccountSecurityActionsProps) {
  const [internalPasswordOpen, setInternalPasswordOpen] = useState(false)
  const passwordDialogOpen = onOpenPasswordDialogChange ? openPasswordDialog : internalPasswordOpen
  const setPasswordDialogOpen = onOpenPasswordDialogChange ?? setInternalPasswordOpen
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  useEffect(() => {
    if (passwordDialogOpen) reset()
  }, [passwordDialogOpen, reset])

  const handlePasswordSubmit = async (values: ChangePasswordFormValues) => {
    await onChangePassword?.(values)
    reset()
    setPasswordDialogOpen(false)
  }

  return (
    <>
      <Card className={cn(className)}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent" />
            <h3 className="font-serif text-xl font-semibold">Security</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            Password, two-factor, and account actions
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="gap-2 border-accent/30 hover:border-accent hover:bg-accent/10"
              onClick={() => setPasswordDialogOpen(true)}
            >
              <KeyRound className="h-4 w-4" />
              Change Password
            </Button>
            {onRequestAccountDeletion && (
              <Button
                variant="ghost"
                className="gap-2 text-muted-foreground hover:text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
                Request account deletion
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            Use a strong password with at least 8 characters, including uppercase,
            lowercase, and numbers.
          </p>
        </CardContent>
      </Card>

      <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
        <DialogContent
          className="sm:max-w-md"
          aria-describedby="change-password-description"
        >
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <p id="change-password-description" className="sr-only">
              Enter your current password and choose a new password
            </p>
          </DialogHeader>
          <form
            onSubmit={handleSubmit(handlePasswordSubmit)}
            className="space-y-4"
          >
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
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : 'Update password'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request account deletion?</AlertDialogTitle>
            <AlertDialogDescription>
              This will submit a request to delete your account. Our team will
              contact you within 48 hours to confirm. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onRequestAccountDeletion?.()
                setDeleteDialogOpen(false)
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Submit request
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
