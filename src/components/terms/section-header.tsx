import { cn } from '@/lib/utils'

export interface SectionHeaderProps {
  label?: string
  title: string
  subtitle?: string
  className?: string
}

export function SectionHeader({
  label,
  title,
  subtitle,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {label ? (
        <span
          className="block text-xs font-semibold uppercase tracking-wider text-accent"
          aria-hidden
        >
          {label}
        </span>
      ) : null}
      <h2 className="font-serif text-2xl font-semibold text-foreground sm:text-3xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="text-muted-foreground">{subtitle}</p>
      ) : null}
    </div>
  )
}
