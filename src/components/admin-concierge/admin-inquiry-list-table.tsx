import { Link } from 'react-router-dom'
import { ExternalLink, MoreHorizontal, Inbox, FilterX, LayoutDashboard } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDateShort } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Inquiry } from '@/types'

export interface AdminInquiryListTableProps {
  inquiries: Inquiry[]
  isLoading?: boolean
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  onExportSingle?: (inquiry: Inquiry) => void
  onQuickView?: (inquiry: Inquiry) => void
  /** When true, empty state shows "no matches" copy with clear filters CTA */
  hasActiveFilters?: boolean
  /** Called when user clicks "Clear filters" in empty state */
  onClearFilters?: () => void
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number) => void
  className?: string
}

/** Status badge classes using design tokens (no hardcoded hex) */
function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    new: 'bg-info/20 text-info',
    contacted: 'bg-warning/20 text-warning',
    in_review: 'bg-info/20 text-info',
    deposit_paid: 'bg-success/20 text-success',
    confirmed: 'bg-success/20 text-success',
    closed: 'bg-muted text-muted-foreground',
    cancelled: 'bg-muted text-muted-foreground',
  }
  return map[status] ?? 'bg-muted text-muted-foreground'
}

/** Payment badge classes using design tokens */
function getPaymentBadgeClass(paymentState?: string): string {
  const map: Record<string, string> = {
    paid: 'bg-success/20 text-success',
    pending: 'bg-warning/20 text-warning',
    cancelled: 'bg-muted text-muted-foreground',
  }
  return map[paymentState ?? 'pending'] ?? 'bg-muted text-muted-foreground'
}

export function AdminInquiryListTable({
  inquiries,
  isLoading,
  selectedIds,
  onSelectionChange,
  onExportSingle,
  onQuickView,
  hasActiveFilters,
  onClearFilters,
  className,
}: AdminInquiryListTableProps) {
  const list = Array.isArray(inquiries) ? inquiries : []

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    onSelectionChange(next)
  }

  const toggleSelectAll = () => {
    if (selectedIds.size === list.length) {
      onSelectionChange(new Set())
    } else {
      onSelectionChange(new Set(list.map((i) => i.id)))
    }
  }

  if (isLoading) {
    return (
      <div
        className={cn('overflow-x-auto', className)}
        role="status"
        aria-label="Loading inquiries"
        aria-busy="true"
      >
        <div className="min-w-[640px] space-y-0">
          {/* Table header skeleton */}
          <div className="flex border-b border-border px-4 py-3">
            <Skeleton className="h-4 w-8 shrink-0 rounded" />
            <Skeleton className="ml-4 h-4 w-24 rounded" />
            <Skeleton className="ml-4 h-4 w-20 rounded" />
            <Skeleton className="ml-4 h-4 w-28 rounded" />
            <Skeleton className="ml-4 h-4 w-16 rounded" />
            <Skeleton className="ml-4 h-4 w-16 rounded" />
            <Skeleton className="ml-4 h-4 w-20 rounded" />
            <Skeleton className="ml-auto h-4 w-16 rounded" />
          </div>
          {/* Row skeletons with shimmer */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center border-b border-border/50 px-4 py-3"
            >
              <Skeleton className="h-4 w-8 shrink-0 rounded" />
              <Skeleton className="ml-4 h-4 w-20 rounded" />
              <Skeleton className="ml-4 h-4 w-32 rounded" />
              <Skeleton className="ml-4 h-4 w-24 rounded" />
              <Skeleton className="ml-4 h-4 w-16 rounded" />
              <Skeleton className="ml-4 h-4 w-14 rounded" />
              <Skeleton className="ml-4 h-4 w-20 rounded" />
              <Skeleton className="ml-auto h-8 w-8 rounded" />
            </div>
          ))}
        </div>
        <span className="sr-only">Loading inquiries table...</span>
      </div>
    )
  }

  if (list.length === 0) {
    const isFiltered = Boolean(hasActiveFilters && onClearFilters)
    return (
      <Card
        className={cn(
          'animate-fade-in border-border shadow-card',
          'transition-shadow duration-200 hover:shadow-card-hover',
          className
        )}
        role="status"
        aria-live="polite"
        aria-label={isFiltered ? 'No inquiries match your filters' : 'No inquiries yet'}
      >
        <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50"
            aria-hidden
          >
            {isFiltered ? (
              <FilterX className="h-8 w-8 text-muted-foreground" aria-hidden />
            ) : (
              <Inbox className="h-8 w-8 text-muted-foreground" aria-hidden />
            )}
          </div>
          <h3 className="font-serif text-lg font-semibold text-foreground">
            {isFiltered ? 'No inquiries match your filters' : 'No inquiries yet'}
          </h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            {isFiltered
              ? 'Try adjusting your search or filter criteria to see more results.'
              : 'Your first inquiry will appear here when guests submit stay requests.'}
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            {isFiltered && onClearFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={onClearFilters}
                className="border-accent/50 text-accent hover:bg-accent/10 focus-visible:ring-accent"
                aria-label="Clear all filters and show all inquiries"
              >
                <FilterX className="mr-2 h-4 w-4" aria-hidden />
                Clear filters
              </Button>
            )}
            {!isFiltered && (
              <Button
                variant="default"
                size="sm"
                className="bg-accent text-accent-foreground hover:bg-accent/90 focus-visible:ring-accent"
                aria-label="Go to dashboard overview"
                asChild
              >
                <Link to="/admin/concierge">
                  <LayoutDashboard className="mr-2 h-4 w-4" aria-hidden />
                  Go to Dashboard
                </Link>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      {/* Desktop table */}
      <table
        className="w-full min-w-[640px] border-collapse"
        role="table"
        aria-label="Inquiries list"
      >
        <thead>
          <tr className="border-b border-border">
            <th scope="col" className="sticky left-0 z-10 bg-card px-4 py-3 text-left w-12">
              <Checkbox
                checked={selectedIds.size === list.length && list.length > 0}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all inquiries"
              />
            </th>
            <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Reference
            </th>
            <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Guest
            </th>
            <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Destination
            </th>
            <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Status
            </th>
            <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Payment
            </th>
            <th scope="col" className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Created At
            </th>
            <th scope="col" className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {list.map((inquiry) => {
            const listing = typeof inquiry.listing === 'object' ? inquiry.listing : null
            const guest = typeof inquiry.guest === 'object' ? inquiry.guest : null
            const title = listing?.title ?? 'Destination'
            const guestName = guest?.full_name ?? guest?.email ?? 'Guest'
            const guestEmail = guest?.email ?? ''
            return (
              <tr
                key={inquiry.id}
                className="border-b border-border/50 transition-colors hover:bg-secondary/30"
              >
                <td className="sticky left-0 z-10 bg-card px-4 py-3">
                  <Checkbox
                    checked={selectedIds.has(inquiry.id)}
                    onCheckedChange={() => toggleSelect(inquiry.id)}
                    aria-label={`Select ${inquiry.reference}`}
                  />
                </td>
                <td className="px-4 py-3">
                  <Link
                    to={`/admin/inquiries/${inquiry.id}`}
                    className="font-mono text-sm text-accent hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`View inquiry ${inquiry.reference ?? inquiry.id}`}
                  >
                    {inquiry.reference ?? inquiry.id}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium">{guestName}</div>
                  {guestEmail && (
                    <div className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {guestEmail}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 font-medium">{title}</td>
                <td className="px-4 py-3">
                  <span
                    aria-label={`Status: ${(inquiry.status ?? '').replace('_', ' ')}`}
                    className={cn(
                      'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                      getStatusBadgeClass(inquiry.status ?? '')
                    )}
                  >
                    {(inquiry.status ?? '').replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span
                    aria-label={`Payment: ${(inquiry.payment_state ?? 'pending').replace('_', ' ')}`}
                    className={cn(
                      'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                      getPaymentBadgeClass(inquiry.payment_state)
                    )}
                  >
                    {(inquiry.payment_state ?? 'pending').replace('_', ' ')}
                  </span>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {formatDateShort(inquiry.created_at ?? '')}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      asChild
                    >
                      <Link to={`/admin/inquiries/${inquiry.id}`} aria-label={`Open ${inquiry.reference}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          aria-label={`More actions for ${inquiry.reference}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {onQuickView && (
                          <DropdownMenuItem
                            onClick={() => onQuickView(inquiry)}
                            aria-label={`Quick view ${inquiry.reference ?? inquiry.id}`}
                          >
                            Quick view
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                          <Link
                            to={`/admin/inquiries/${inquiry.id}`}
                            aria-label={`Open full details for ${inquiry.reference ?? inquiry.id}`}
                          >
                            Open details
                          </Link>
                        </DropdownMenuItem>
                        {onExportSingle && (
                          <DropdownMenuItem
                            onClick={() => onExportSingle(inquiry)}
                            aria-label={`Export ${inquiry.reference ?? inquiry.id} to CSV`}
                          >
                            Export single
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Mobile cards */}
      <div className="mt-4 block space-y-2 lg:hidden" role="list" aria-label="Inquiries list (mobile view)">
        {list.map((inquiry) => {
          const listing = typeof inquiry.listing === 'object' ? inquiry.listing : null
          const guest = typeof inquiry.guest === 'object' ? inquiry.guest : null
          const title = listing?.title ?? 'Destination'
          const guestName = guest?.full_name ?? guest?.email ?? 'Guest'
          return (
            <Link
              key={inquiry.id}
              to={`/admin/inquiries/${inquiry.id}`}
              aria-label={`View inquiry ${inquiry.reference ?? inquiry.id} - ${title}`}
            >
              <Card className="transition-all duration-200 hover:shadow-card-hover hover:border-accent/30">
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-sm text-accent">
                      {inquiry.reference ?? inquiry.id}
                    </span>
                    <p className="font-medium truncate">{title}</p>
                    <p className="text-sm text-muted-foreground truncate">{guestName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateShort(inquiry.created_at ?? '')}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col gap-1">
                    <span
                      aria-label={`Status: ${(inquiry.status ?? '').replace('_', ' ')}`}
                      className={cn(
                        'rounded-full px-2 py-1 text-xs',
                        getStatusBadgeClass(inquiry.status ?? '')
                      )}
                    >
                      {(inquiry.status ?? '').replace('_', ' ')}
                    </span>
                    <span
                      aria-label={`Payment: ${(inquiry.payment_state ?? 'pending').replace('_', ' ')}`}
                      className={cn(
                        'rounded-full px-2 py-1 text-xs',
                        getPaymentBadgeClass(inquiry.payment_state)
                      )}
                    >
                      {(inquiry.payment_state ?? 'pending').replace('_', ' ')}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
