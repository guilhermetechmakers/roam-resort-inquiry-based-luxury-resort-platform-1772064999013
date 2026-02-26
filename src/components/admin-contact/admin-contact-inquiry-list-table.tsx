import { MoreHorizontal } from 'lucide-react'
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
import { cn } from '@/lib/utils'
import type { ContactInquiry } from '@/types/contact-inquiry'

function formatDate(d: string | null | undefined): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return String(d)
  }
}

function getStatusBadgeClass(status: string): string {
  const map: Record<string, string> = {
    new: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    contacted: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    in_progress: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
    deposit_paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    confirmed: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    closed: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300',
  }
  return map[status] ?? 'bg-muted text-muted-foreground'
}

export interface AdminContactInquiryListTableProps {
  inquiries: ContactInquiry[]
  isLoading?: boolean
  selectedIds: Set<string>
  onSelectionChange: (ids: Set<string>) => void
  onExportSingle?: (inquiry: ContactInquiry) => void
  onQuickView?: (inquiry: ContactInquiry) => void
  className?: string
}

export function AdminContactInquiryListTable({
  inquiries,
  isLoading,
  selectedIds,
  onSelectionChange,
  onExportSingle,
  onQuickView,
  className,
}: AdminContactInquiryListTableProps) {
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
          <p className="font-medium text-foreground">No contact inquiries match your filters.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your search or filter criteria.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('overflow-x-auto', className)}>
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
              Name
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Subject
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Type
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Status
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
              Created
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {list.map((i) => (
            <tr
              key={i.id}
              className="border-b border-border transition-colors hover:bg-muted/30"
            >
              <td className="sticky left-0 z-10 bg-card px-4 py-3">
                <Checkbox
                  checked={selectedIds.has(i.id)}
                  onCheckedChange={() => toggleSelect(i.id)}
                  aria-label={`Select ${i.inquiry_reference ?? i.id}`}
                />
              </td>
              <td className="px-4 py-3 text-sm font-medium">
                {i.inquiry_reference ?? '—'}
              </td>
              <td className="px-4 py-3 text-sm">
                <div>{i.name ?? '—'}</div>
                <div className="text-xs text-muted-foreground">{i.email ?? ''}</div>
              </td>
              <td className="px-4 py-3 text-sm">{i.subject ?? '—'}</td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                    i.is_concierge ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                  )}
                >
                  {i.is_concierge ? 'Concierge' : 'General'}
                </span>
              </td>
              <td className="px-4 py-3">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2 py-0.5 text-xs font-medium',
                    getStatusBadgeClass(i.status ?? '')
                  )}
                >
                  {i.status ?? '—'}
                </span>
              </td>
              <td className="px-4 py-3 text-sm text-muted-foreground">
                {formatDate(i.created_at)}
              </td>
              <td className="px-4 py-3 text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onQuickView && (
                      <DropdownMenuItem onClick={() => onQuickView(i)}>
                        View details
                      </DropdownMenuItem>
                    )}
                    {onExportSingle && (
                      <DropdownMenuItem onClick={() => onExportSingle(i)}>
                        Export CSV
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
