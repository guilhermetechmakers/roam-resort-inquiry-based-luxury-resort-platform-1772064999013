/**
 * CheckmarkGraphic - Scalable vector graphic with bronze-gold stroke/fill and subtle animation.
 * Used for success state in GenericLoadingSuccessPanel.
 */
import { cn } from '@/lib/utils'

export interface CheckmarkGraphicProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  sm: 'h-12 w-12',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
}

export function CheckmarkGraphic({ size = 'lg', className }: CheckmarkGraphicProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center text-accent animate-checkmark-pop',
        sizeClasses[size],
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 52 52"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full"
      >
        <circle
          cx="26"
          cy="26"
          r="24"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          className="opacity-20"
        />
        <path
          d="M14.1 27.2l7.1 7.2 16.7-16.8"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  )
}
