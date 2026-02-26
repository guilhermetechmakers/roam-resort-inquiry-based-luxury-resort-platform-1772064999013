import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface CreateListingButtonProps {
  className?: string
}

export function CreateListingButton({ className }: CreateListingButtonProps) {
  return (
    <Link to="/host/listings/new" className={cn('inline-flex', className)}>
      <Button
        className="bg-accent text-accent-foreground shadow-md hover:bg-accent/90 hover:shadow-accent-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
        aria-label="Create new listing"
      >
        <Plus className="mr-2 h-5 w-5" aria-hidden />
        Create Listing
      </Button>
    </Link>
  )
}
