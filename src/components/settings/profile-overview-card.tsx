import { Pencil, KeyRound } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardHeader } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import type { SettingsUserProfile } from '@/types/settings'

function maskEmail(email: string): string {
  if (!email || email.length < 5) return '•••'
  const [local, domain] = email.split('@')
  if (!domain) return '•••'
  const masked = local && local.length >= 2 ? local.slice(0, 2) + '•••' : '•••'
  return `${masked}@${domain}`
}

export interface ProfileOverviewCardProps {
  profile: SettingsUserProfile | null | undefined
  isLoading?: boolean
  onEditProfile?: () => void
  onChangePassword?: () => void
}

export function ProfileOverviewCard({
  profile,
  isLoading,
  onEditProfile,
  onChangePassword,
}: ProfileOverviewCardProps) {
  if (isLoading) {
    return (
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-card-hover">
        <CardHeader>
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardHeader>
      </Card>
    )
  }

  if (!profile) return null

  const name = profile.name ?? profile.email ?? 'Guest'
  const email = profile.email ?? ''
  const initials = name
    .split(/\s+/)
    .map((s) => (s && s[0]) || '')
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U'

  return (
    <Card className="overflow-hidden border-accent/20 transition-all duration-300 hover:shadow-card-hover hover:scale-[1.01]">
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16 border-2 border-accent/30">
              {profile.avatarUrl ? (
                <img src={profile.avatarUrl} alt="" className="h-full w-full object-cover" />
              ) : null}
              <AvatarFallback className="bg-accent/10 text-accent font-serif text-xl">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-serif text-2xl font-semibold">{name}</h2>
              <p className="text-muted-foreground" title={email}>
                {maskEmail(email)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onEditProfile}
              className="gap-2 border-accent/30 hover:border-accent hover:bg-accent/10 transition-all hover:scale-[1.02]"
            >
              <Pencil className="h-4 w-4" />
              Edit profile
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onChangePassword}
              className="gap-2 border-accent/30 hover:border-accent hover:bg-accent/10 transition-all hover:scale-[1.02]"
            >
              <KeyRound className="h-4 w-4" />
              Change password
            </Button>
          </div>
        </div>
      </CardHeader>
    </Card>
  )
}
