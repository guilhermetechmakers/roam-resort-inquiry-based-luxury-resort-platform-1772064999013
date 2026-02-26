import {
  getPasswordStrength,
  type PasswordStrength as PasswordStrengthType,
} from '@/lib/validation/auth-validation'
import { cn } from '@/lib/utils'

export interface PasswordStrengthMeterProps {
  password: string
  className?: string
}

const strengthColors: Record<number, string> = {
  0: 'bg-destructive',
  1: 'bg-destructive',
  2: 'bg-amber-500',
  3: 'bg-accent',
  4: 'bg-emerald-600',
  5: 'bg-emerald-600',
}

export function PasswordStrengthMeter({ password, className }: PasswordStrengthMeterProps) {
  if (!password) return null

  const strength: PasswordStrengthType = getPasswordStrength(password)
  const widthPercent = Math.min((strength.score / 5) * 100, 100)
  const colorClass = strengthColors[strength.score] ?? strengthColors[0]

  return (
    <div className={cn('space-y-2', className)} role="status" aria-live="polite">
      <div className="flex gap-1 h-1.5 rounded-full overflow-hidden bg-muted">
        <div
          className={cn('h-full rounded-full transition-all duration-300', colorClass)}
          style={{ width: `${widthPercent}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground">
        {strength.label}
        {strength.score < 3 && (
          <span className="ml-1">
            — add uppercase, lowercase, number, or special character
          </span>
        )}
      </p>
    </div>
  )
}
