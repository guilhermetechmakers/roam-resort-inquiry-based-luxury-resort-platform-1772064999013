import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { profileUpdateSchema, type ProfileUpdateFormData } from '@/lib/validation/profile-validation'
import type { UserProfile } from '@/types'
import { useUpdateProfile } from '@/hooks/use-profile'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export interface ProfileEditorPanelProps {
  profile: UserProfile
  onSuccess?: () => void
  onCancel?: () => void
}

export function ProfileEditorPanel({
  profile,
  onSuccess,
  onCancel,
}: ProfileEditorPanelProps) {
  const updateProfile = useUpdateProfile()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ProfileUpdateFormData>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: {
      name: profile.name ?? '',
      email: profile.email ?? '',
      phone: profile.phone ?? '',
      locale: profile.locale ?? 'en',
      contactPrefs: profile.contactPrefs ?? { email: true },
    },
  })

  const contactPrefs = watch('contactPrefs')

  const onSubmit = async (data: ProfileUpdateFormData) => {
    try {
      await updateProfile.mutateAsync({
        name: data.name,
        phone: data.phone || undefined,
        locale: data.locale || undefined,
        contactPrefs: data.contactPrefs,
      })
      toast.success('Profile updated')
      onSuccess?.()
    } catch (err) {
      toast.error((err as Error).message ?? 'Failed to update profile')
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          {...register('name')}
          className={cn(errors.name && 'border-destructive')}
          placeholder="Your name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          disabled
          className="bg-muted"
        />
        <p className="mt-1 text-xs text-muted-foreground">
          Email cannot be changed here. Contact support if needed.
        </p>
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          {...register('phone')}
          placeholder="+1 234 567 8900"
          className={cn(errors.phone && 'border-destructive')}
        />
        {errors.phone && (
          <p className="mt-1 text-sm text-destructive">{errors.phone.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="locale">Language</Label>
        <Select
          value={watch('locale') ?? 'en'}
          onValueChange={(v) => setValue('locale', v, { shouldDirty: true })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">English</SelectItem>
            <SelectItem value="es">Español</SelectItem>
            <SelectItem value="fr">Français</SelectItem>
            <SelectItem value="de">Deutsch</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Contact preferences</Label>
        <div className="mt-2 flex flex-wrap gap-4">
          <label className="flex items-center gap-2">
            <Checkbox
              checked={contactPrefs?.email ?? true}
              onCheckedChange={(c) =>
                setValue('contactPrefs', {
                  ...contactPrefs,
                  email: !!c,
                })
              }
            />
            <span className="text-sm">Email</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={contactPrefs?.sms ?? false}
              onCheckedChange={(c) =>
                setValue('contactPrefs', {
                  ...contactPrefs,
                  sms: !!c,
                })
              }
            />
            <span className="text-sm">SMS</span>
          </label>
          <label className="flex items-center gap-2">
            <Checkbox
              checked={contactPrefs?.phone ?? false}
              onCheckedChange={(c) =>
                setValue('contactPrefs', {
                  ...contactPrefs,
                  phone: !!c,
                })
              }
            />
            <span className="text-sm">Phone</span>
          </label>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={updateProfile.isPending || !isDirty}
          className="transition-all hover:scale-[1.02]"
        >
          {updateProfile.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Save changes
        </Button>
      </div>
    </form>
  )
}
