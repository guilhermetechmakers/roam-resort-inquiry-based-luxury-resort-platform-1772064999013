import { Link } from 'react-router-dom'
import { ExternalLink, MoreHorizontal } from 'lucide-react'
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
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Inquiry } from '@/types'

export interface AdminInquiryListTableProps {
  inquiries: Inquiry[]
  isLoading?: boolean
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  onExportSingle?: (inquiry: Inquiry) => void
  onQuickView?: (inquiry: Inquiry) => void
  page?: number
  pageSize?: number
  total?: number
  onPageChange?: (page: number) => void
  className?: string
}

function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    contacted: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    deposit_paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    cancelled: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  }
  return map[status] ?? 'bg-muted text-muted-foreground'
}

export function AdminInquiryListTable({
  inquiries,
  isLoading,
  selectedIds,
  onSelectionChange,
  onExportSingle,
  onQuickView,
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
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    )
  }

  if (list.length === 0) {
    return (
      <Card className={cn(className)}>
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <p className="font-medium text-foreground">No inquiries match your filters.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search or filter criteria.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
      {/* Desktop table */}
      <table className="w-full min-w-[640px] border-collapse" role="table">
        <thead>
          <tr className="border-b border-border">
            <th className="sticky left-0 z-10 bg-card px-4 py-3 text-left">
              <Checkbox
                checked={selectedIds.size === list.length && list.length > 0}
                onCheckedChange={toggleSelectAll}
                aria-label="Select all"
              />
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Reference
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Listing
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Dates
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Guests
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Status
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {list.map((inquiry) => {
            const listing = typeof inquiry.listing === 'object' ? inquiry.listing : null
            const title = listing?.title ?? 'Destination'
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
                    className="font-mono text-sm text-accent hover:underline"
                  >
                    {inquiry.reference ?? inquiry.id}
                  </Link>
                </td>
                <td className="px-4 py-3 font-medium">{title}</td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {inquiry.check_in && formatDate(inquiry.check_in)} –{' '}
                  {inquiry.check_out && formatDate(inquiry.check_out)}
                </td>
                <td className="px-4 py-3">{inquiry.guests_count ?? '—'}</td>
                <td className="px-4 py-3">
                  <span
                    className={cn(
                      'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                      getStatusBadgeClass(inquiry.status ?? '')
                    )}
                  >
                    {(inquiry.status ?? '').replace('_', ' ')}
                  </span>
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
                          <DropdownMenuItem onClick={() => onQuickView(inquiry)}>
                            Quick view
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem asChild>
                          <Link to={`/admin/inquiries/${inquiry.id}`}>Open details</Link>
                        </DropdownMenuItem>
                        {onExportSingle && (
                          <DropdownMenuItem onClick={() => onExportSingle(inquiry)}>
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
      <div className="mt-4 block space-y-2 lg:hidden">
        {list.map((inquiry) => {
          const listing = typeof inquiry.listing === 'object' ? inquiry.listing : null
          const title = listing?.title ?? 'Destination'
          return (
            <Link key={inquiry.id} to={`/admin/inquiries/${inquiry.id}`}>
              <Card className="transition-colors hover:bg-secondary/50">
                <CardContent className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0 flex-1">
                    <span className="font-mono text-sm text-muted-foreground">
                      {inquiry.reference}
                    </span>
                    <p className="font-medium truncate">{title}</p>
                    <p className="text-sm text-muted-foreground">
                      {inquiry.check_in && formatDate(inquiry.check_in)} –{' '}
                      {inquiry.check_out && formatDate(inquiry.check_out)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      'shrink-0 rounded-full px-2 py-1 text-xs',
                      getStatusBadgeClass(inquiry.status ?? '')
                    )}
                  >
                    {(inquiry.status ?? '').replace('_', ' ')}
                  </span>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
