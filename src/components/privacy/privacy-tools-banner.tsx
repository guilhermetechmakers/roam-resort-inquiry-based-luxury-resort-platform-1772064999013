import { Link } from 'react-router-dom'
import { Shield, Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface PrivacyToolsBannerProps {
  className?: string
}

export function PrivacyToolsBanner({ className }: PrivacyToolsBannerProps) {
  return (
    <section
      className={cn(
        'rounded-xl border border-accent/30 bg-secondary/30 p-8 sm:p-10',
        className
      )}
      aria-labelledby="privacy-tools-heading"
    >
      <h2
        id="privacy-tools-heading"
        className="font-serif text-2xl font-semibold text-foreground"
      >
        Privacy & Data Rights
      </h2>
      <p className="mt-4 text-muted-foreground">
        Under GDPR and CCPA, you have the right to access, export, and delete
        your personal data. Use our Privacy & Legal Compliance tools to exercise
        these rights.
      </p>
      <div className="mt-6 flex flex-wrap gap-4">
        <Button
          asChild
          className="gap-2 bg-accent text-accent-foreground hover:bg-accent/90 transition-all duration-200 hover:scale-[1.02] focus-visible:ring-accent"
        >
          <Link to="/settings" aria-label="Go to Settings for data export and deletion">
            <Shield className="h-5 w-5" aria-hidden />
            Data Export & Deletion
          </Link>
        </Button>
        <Button
          asChild
          variant="outline"
          className="gap-2 border-accent/30 hover:border-accent hover:bg-accent/10"
        >
          <Link to="/settings" aria-label="Request data export">
            <Download className="h-4 w-4" aria-hidden />
            Request Export
          </Link>
        </Button>
        <Button
          asChild
          variant="ghost"
          className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <Link to="/settings" aria-label="Delete account">
            <Trash2 className="h-4 w-4" aria-hidden />
            Delete Account
          </Link>
        </Button>
      </div>
    </section>
  )
}
