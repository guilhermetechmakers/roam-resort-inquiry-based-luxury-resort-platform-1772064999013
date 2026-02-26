import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { changePasswordSchema, type ChangePasswordFormData } from '@/lib/validation/profile-validation'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface PasswordChangeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PasswordChangeModal({ open, onOpenChange }: PasswordChangeModalProps) {
  const [isPending, setIsPending] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordFormData>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsPending(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword,
      })
      if (error) throw error
      toast.success('Password updated')
      reset()
      onOpenChange(false)
    } catch (err) {
      toast.error((err as Error).message ?? 'Failed to update password')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" showClose>
        <DialogHeader>
          <DialogTitle>Change password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="currentPassword">Current password</Label>
            <Input
              id="currentPassword"
              type="password"
              {...register('currentPassword')}
              className={cn(errors.currentPassword && 'border-destructive')}
              placeholder="••••••••"
            />
            {errors.currentPassword && (
              <p className="mt-1 text-sm text-destructive">
                {errors.currentPassword.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="newPassword">New password</Label>
            <Input
              id="newPassword"
              type="password"
              {...register('newPassword')}
              className={cn(errors.newPassword && 'border-destructive')}
              placeholder="••••••••"
            />
            {errors.newPassword && (
              <p className="mt-1 text-sm text-destructive">
                {errors.newPassword.message}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              Min 8 characters, uppercase, lowercase, number, special character
            </p>
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm new password</Label>
            <Input
              id="confirmPassword"
              type="password"
              {...register('confirmPassword')}
              className={cn(errors.confirmPassword && 'border-destructive')}
              placeholder="••••••••"
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-destructive">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Update password
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
