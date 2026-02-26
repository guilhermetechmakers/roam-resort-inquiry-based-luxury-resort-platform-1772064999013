import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { User, Globe, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
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
import { ValidationMessages } from './validation-messages'
import { accountSettingsSchema, type AccountSettingsFormData } from '@/lib/validation/settings-validation'
import { SUPPORTED_LANGUAGES, SUPPORTED_TIMEZONES } from '@/types/settings'
import type { SettingsUserProfile } from '@/types/settings'
import { cn } from '@/lib/utils'

export interface AccountSettingsProps {
  profile: SettingsUserProfile | null | undefined
  isLoading?: boolean
  onSave?: (data: AccountSettingsFormData) => Promise<void>
  isSaving?: boolean
}

export function AccountSettings({
  profile,
  isLoading,
  onSave,
  isSaving = false,
}: AccountSettingsProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm<AccountSettingsFormData>({
    resolver: zodResolver(accountSettingsSchema),
    defaultValues: {
      name: profile?.name ?? '',
      email: profile?.email ?? '',
      language: profile?.language ?? 'en',
      timezone: profile?.timezone ?? 'America/New_York',
    },
  })

  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name ?? '',
        email: profile.email ?? '',
        language: profile.language ?? 'en',
        timezone: profile.timezone ?? 'America/New_York',
      })
    }
  }, [profile, reset])

  const language = watch('language')
  const timezone = watch('timezone')

  const onSubmit = async (data: AccountSettingsFormData) => {
    await onSave?.(data)
  }

  if (isLoading) {
    return (
      <Card className="overflow-hidden transition-all duration-300">
        <CardHeader>
          <div className="h-6 w-48 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-4 w-64 animate-pulse rounded bg-muted" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card id="account-settings" className="overflow-hidden transition-all duration-300 hover:shadow-card-hover">
      <CardHeader>
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-accent" />
          <h3 className="font-serif text-xl font-semibold">Account Settings</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Personal details and locale preferences
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register('name')}
              placeholder="Your name"
              className={cn('mt-1.5', errors.name && 'border-destructive')}
              autoComplete="name"
            />
            <ValidationMessages error={errors.name?.message} />
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...register('email')}
              placeholder="you@example.com"
              className={cn('mt-1.5', errors.email && 'border-destructive')}
              autoComplete="email"
            />
            <ValidationMessages error={errors.email?.message} />
          </div>

          <div>
            <Label htmlFor="language" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Language
            </Label>
            <Select
              value={language}
              onValueChange={(v) => setValue('language', v, { shouldDirty: true })}
            >
              <SelectTrigger id="language" className="mt-1.5">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {(SUPPORTED_LANGUAGES ?? []).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ValidationMessages error={errors.language?.message} />
          </div>

          <div>
            <Label htmlFor="timezone" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Timezone
            </Label>
            <Select
              value={timezone}
              onValueChange={(v) => setValue('timezone', v, { shouldDirty: true })}
            >
              <SelectTrigger id="timezone" className="mt-1.5">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent>
                {(SUPPORTED_TIMEZONES ?? []).map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <ValidationMessages error={errors.timezone?.message} />
          </div>

          {isDirty && onSave && (
            <Button type="submit" disabled={isSaving} className="bg-accent hover:bg-accent/90">
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
