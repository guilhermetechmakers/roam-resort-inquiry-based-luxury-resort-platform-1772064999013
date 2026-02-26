/**
 * RedirectNotice - Indicator that user will be redirected to Roam after Stripe completes payment.
 */

import { ArrowRight } from 'lucide-react'

export function RedirectNotice() {
  return (
    <div
      className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-4"
      role="status"
      aria-label="Redirect notice"
    >
      <ArrowRight className="h-5 w-5 shrink-0 text-accent animate-pulse" aria-hidden />
      <p className="text-sm text-muted-foreground">
        After completing payment on Stripe, you will be redirected back to Roam Resort with your
        updated inquiry status.
      </p>
    </div>
  )
}
