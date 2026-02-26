/**
 * ActionsBar — Lightweight actions for Host Listing Detail.
 * Edit Listing, Share Link (copy-to-clipboard), Visibility indicator.
 * Read-only: no mutation of inquiries; visibility is indicator only.
 */

import { Link } from 'react-router-dom'
import { Pencil, Share2, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import type { HostListingDetail } from '@/types/host-listing-detail'
import { cn } from '@/lib/utils'

export interface ActionsBarProps {
  listing: HostListingDetail | null
  listingUrl: string
  canToggleVisibility?: boolean
  className?: string
}

export function ActionsBar({
  listing,
  listingUrl,
  canToggleVisibility = false,
  className,
}: ActionsBarProps) {
  if (!listing) return null

  const isLive = listing.status === 'Live' || listing.visibility === 'Live'

  const handleShareLink = async () => {
    try {
      await navigator.clipboard.writeText(listingUrl)
      toast.success('Link copied to clipboard')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-4 rounded-xl border border-border bg-card p-4',
        className
      )}
      role="toolbar"
      aria-label="Listing actions"
    >
      <Link to={`/host/listings/${listing.id}`}>
        <Button
          variant="default"
          size="sm"
          className="bg-accent text-accent-foreground hover:bg-accent/90"
          aria-label={`Edit listing ${listing.title}`}
        >
          <Pencil className="mr-1.5 h-4 w-4" aria-hidden />
          Edit Listing
        </Button>
      </Link>

      <Button
        variant="outline"
        size="sm"
        onClick={handleShareLink}
        className="hover:border-accent hover:bg-accent/10 hover:text-accent"
        aria-label="Copy listing link to clipboard"
      >
        <Share2 className="mr-1.5 h-4 w-4" aria-hidden />
        Share Link
      </Button>

      <div
        className="flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-3 py-2"
        aria-label={`Visibility: ${isLive ? 'Live' : 'Draft'}`}
      >
        {isLive ? (
          <Eye className="h-4 w-4 text-muted-foreground" aria-hidden />
        ) : (
          <EyeOff className="h-4 w-4 text-muted-foreground" aria-hidden />
        )}
        <span className="text-sm font-medium text-muted-foreground">
          {isLive ? 'Live' : 'Draft'}
        </span>
        {!canToggleVisibility && (
          <span className="text-xs italic text-muted-foreground">
            (read-only)
          </span>
        )}
      </div>
    </div>
  )
}
