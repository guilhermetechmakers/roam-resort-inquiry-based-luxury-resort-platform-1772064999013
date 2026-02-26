import { useState } from 'react'
import { Pencil, KeyRound, BadgeCheck, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ProfileEditorPanel } from './profile-editor-panel'
import { PasswordChangeModal } from './password-change-modal'
import type { UserProfile } from '@/types'
import { cn } from '@/lib/utils'

export interface ProfileHeaderCardProps {
  profile: UserProfile | null | undefined
  isLoading?: boolean
  isError?: boolean
  error?: Error | null
  onRetry?: () => void
  onProfileUpdated?: () => void
  onEditProfile?: () => void
  onChangePassword?: () => void
}

export function ProfileHeaderCard({
  profile,
  isLoading,
  isError = false,
  error,
  onRetry,
  onProfileUpdated,
  onEditProfile,
  onChangePassword,
}: ProfileHeaderCardProps) {
  const [editOpen, setEditOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)

  const handleEditClick = () => (onEditProfile ? onEditProfile() : setEditOpen(true))
  const handlePasswordClick = () => (onChangePassword ? onChangePassword() : setPasswordOpen(true))

  if (isLoading) {
    return (
      <Card className="animate-pulse">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-full bg-muted" />
            <div className="h-6 w-48 bg-muted rounded" />
          </div>
        </CardHeader>
      </Card>
    )
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <div
            className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 py-12 px-4 sm:py-16"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="h-12 w-12 text-destructive/80" aria-hidden />
            <h4 className="mt-4 font-serif text-lg font-semibold text-foreground">
              Unable to load profile
            </h4>
            <p className="mt-2 max-w-sm text-center text-sm text-muted-foreground">
              {error?.message ?? 'Something went wrong. Please try again.'}
            </p>
            {onRetry && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRetry}
                className="mt-6 border-accent/40 hover:border-accent hover:bg-accent/10"
                aria-label="Retry loading profile"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Try again
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>
    )
  }

  if (!profile) return null

  const initials = (profile.name ?? profile.email ?? 'U')
    .split(/\s+/)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <>
      <Card className="border-accent/20 transition-all duration-300 hover:shadow-card-hover">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16 border-2 border-accent/30">
                <AvatarFallback className="bg-accent/10 text-accent font-serif text-xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-serif text-2xl font-semibold">
                  {profile.name || profile.email || 'Guest'}
                </h2>
                <p className="text-muted-foreground">{profile.email}</p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {profile.emailVerified ? (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                        'bg-success/10 text-success'
                      )}
                    >
                      <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                      Verified
                    </span>
                  ) : (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
                        'bg-warning/10 text-warning'
                      )}
                    >
                      Pending verification
                    </span>
                  )}
                  {profile.phone && (
                    <span className="text-sm text-muted-foreground">
                      {profile.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditClick}
                className="transition-all hover:scale-[1.02] hover:border-accent/50"
                aria-label="Edit profile"
              >
                <Pencil className="mr-2 h-4 w-4" aria-hidden />
                Edit profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePasswordClick}
                className="transition-all hover:scale-[1.02] hover:border-accent/50"
                aria-label="Change password"
              >
                <KeyRound className="mr-2 h-4 w-4" aria-hidden />
                Change password
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {!onEditProfile && (
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-md" showClose>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogHeader>
          <ProfileEditorPanel
            profile={profile}
            onSuccess={() => {
              setEditOpen(false)
              onProfileUpdated?.()
            }}
            onCancel={() => setEditOpen(false)}
          />
        </DialogContent>
      </Dialog>
      )}

      {!onChangePassword && (
      <PasswordChangeModal
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
      />
      )}
    </>
  )
}
