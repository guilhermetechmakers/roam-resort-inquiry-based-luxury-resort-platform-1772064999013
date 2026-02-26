import { Chrome, Apple } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface SocialAuthPlaceholdersProps {
  disabled?: boolean
  className?: string
}

export function SocialAuthPlaceholders({
  disabled = true,
  className,
}: SocialAuthPlaceholdersProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <p className="text-xs text-muted-foreground text-center">
        Coming soon
      </p>
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1 opacity-60 cursor-not-allowed"
          disabled={disabled}
          aria-disabled="true"
          aria-label="Sign in with Google (coming soon)"
        >
          <Chrome className="mr-2 h-4 w-4" />
          Google
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 opacity-60 cursor-not-allowed"
          disabled={disabled}
          aria-disabled="true"
          aria-label="Sign in with Apple (coming soon)"
        >
          <Apple className="mr-2 h-4 w-4" />
          Apple
        </Button>
      </div>
    </div>
  )
}
