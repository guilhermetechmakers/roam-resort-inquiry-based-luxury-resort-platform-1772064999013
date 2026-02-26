import { forwardRef } from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cn } from '@/lib/utils'

export type CTAButtonVariant = 'primary' | 'secondary'

export interface CTAButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string
  variant?: CTAButtonVariant
  disabled?: boolean
  className?: string
  children?: React.ReactNode
  asChild?: boolean
}

const variantClasses = {
  primary: [
    'bg-accent text-accent-foreground shadow-accent-glow',
    'hover:bg-accent/90 hover:shadow-[0_0_24px_rgba(169,124,80,0.4)]',
  ],
  secondary: [
    'border-2 border-accent bg-secondary/80 text-foreground',
    'hover:bg-secondary hover:border-accent/90',
  ],
}

const baseClasses = [
  'inline-flex items-center justify-center gap-2 rounded-lg px-8 py-3 text-base font-semibold transition-all duration-300',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2',
  'disabled:pointer-events-none disabled:opacity-50',
  'hover:scale-[1.02] active:scale-[0.98]',
]

export const CTAButton = forwardRef<HTMLButtonElement, CTAButtonProps>(
  (
    {
      label,
      variant = 'primary',
      disabled = false,
      className,
      children,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const resolvedLabel = label ?? (typeof children === 'string' ? children : undefined)
    const mergedClassName = cn(baseClasses, variantClasses[variant], className)
    if (asChild) {
      return (
        <Slot ref={ref} className={mergedClassName}>
          {children}
        </Slot>
      )
    }
    return (
      <button
        ref={ref}
        type="button"
        disabled={disabled}
        aria-label={resolvedLabel}
        className={mergedClassName}
        {...props}
      >
        {children}
        {label}
      </button>
    )
  }
)
CTAButton.displayName = 'CTAButton'
