import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { HostProfile } from '@/types'

export interface HostInfoBlockProps {
  host?: HostProfile | null
  editorialNote?: string | null
  className?: string
}

const DEFAULT_NOTE =
  'All stays are inquiry-based. Our concierge will respond within 24 hours.'

export function HostInfoBlock({
  host,
  editorialNote,
  className,
}: HostInfoBlockProps) {
  if (!host?.id) return null

  const name = host.name ?? 'Host'
  const bio = host.bio ?? ''
  const avatarUrl = host.avatarUrl
  const note = editorialNote ?? host.editorialNote ?? DEFAULT_NOTE

  return (
    <div
      className={cn(
        'flex flex-col gap-4 rounded-xl border border-border bg-card p-6',
        'transition-all duration-300 hover:shadow-card',
        className
      )}
    >
      <div className="flex items-start gap-4">
        <Avatar className="h-14 w-14 shrink-0 rounded-full border-2 border-accent/30">
          <AvatarImage src={avatarUrl} alt={name} />
          <AvatarFallback className="bg-accent/20 text-accent font-semibold">
            {name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .slice(0, 2)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wider text-accent">
            Your Host
          </p>
          <h4 className="mt-1 font-serif text-lg font-semibold">{name}</h4>
          {bio && (
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {bio}
            </p>
          )}
        </div>
      </div>
      {note && (
        <p className="text-sm text-muted-foreground italic border-l-2 border-accent/50 pl-4">
          {note}
        </p>
      )}
    </div>
  )
}
