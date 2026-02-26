/**
 * HeroVisual - Decorative background gradient aligned with Roam Resort brand.
 * Subtle, non-distracting; supports luxury editorial aesthetic.
 */
import { cn } from '@/lib/utils'

export interface HeroVisualProps {
  className?: string
}

export function HeroVisual({ className }: HeroVisualProps) {
  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className
      )}
      aria-hidden="true"
    >
      {/* Sunset mauves to deep navy gradient - brand palette */}
      <div
        className="absolute inset-0 opacity-90"
        style={{
          background:
            'linear-gradient(180deg, rgb(180 149 135 / 0.15) 0%, rgb(35 33 42 / 0.03) 50%, transparent 100%)',
        }}
      />
      {/* Soft blush accent */}
      <div
        className="absolute -top-24 -right-24 h-96 w-96 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, rgb(209 183 161) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full opacity-15"
        style={{ background: 'radial-gradient(circle, rgb(180 149 135) 0%, transparent 70%)' }}
      />
    </div>
  )
}
