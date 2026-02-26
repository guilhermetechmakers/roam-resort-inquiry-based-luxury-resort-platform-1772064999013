import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Sidebar, adminSidebarLinks } from '@/components/layout/sidebar'
import { useAuth } from '@/contexts/auth-context'
import { useAdminInquiries } from '@/hooks/use-inquiries'
import { Download } from 'lucide-react'
import type { Inquiry } from '@/types'

function escapeCsvCell(value: unknown): string {
  if (value == null) return ''
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function inquiriesToCsv(inquiries: Inquiry[]): string {
  const headers = [
    'Reference',
    'Listing',
    'Check-in',
    'Check-out',
    'Guests',
    'Room Prefs',
    'Budget Hint',
    'Status',
    'Created',
  ]
  const rows = (inquiries ?? []).map((i) => {
    const listing = typeof i.listing === 'object' ? i.listing : null
    return [
      escapeCsvCell(i.reference),
      escapeCsvCell(listing?.title ?? ''),
      escapeCsvCell(i.check_in ?? ''),
      escapeCsvCell(i.check_out ?? ''),
      escapeCsvCell(i.guests_count ?? ''),
      escapeCsvCell(Array.isArray(i.room_prefs) ? i.room_prefs.join('; ') : ''),
      escapeCsvCell(i.budget_hint ?? ''),
      escapeCsvCell(i.status ?? ''),
      escapeCsvCell(i.created_at ?? ''),
    ]
  })
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
}

export function AdminExportsPage() {
  const { hasRole, isLoading: authLoading } = useAuth()
  const { data: inquiries } = useAdminInquiries()
  const location = useLocation()
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered = (inquiries ?? []).filter((i) => {
    if (statusFilter === 'all') return true
    return i.status === statusFilter
  })

  const handleExport = () => {
    const csv = inquiriesToCsv(filtered)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `inquiries-export-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success(`Exported ${filtered.length} inquiries`)
    import('@/lib/audit-logger').then(({ auditLog }) => {
      auditLog('inquiry_export', { count: filtered.length })
    }).catch(() => {})
  }

  if (authLoading) return null
  if (!hasRole('concierge')) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    )
  }

  const state = location.state as { inquiryId?: string; inquiryRef?: string } | undefined

  return (
    <div className="flex min-h-screen">
      <Sidebar links={adminSidebarLinks} title="Concierge" />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="font-serif text-3xl font-bold">CSV Export</h1>
          <p className="mt-2 text-muted-foreground">
            Build and download exports for reconciliation.
          </p>

          <Card className="mt-8">
            <CardHeader>
              <h2 className="font-serif text-xl font-semibold">Export Builder</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Filter by status and download a CSV of inquiries. The export includes reference,
                listing, dates, guests, room preferences, budget hint, and status.
              </p>
              <div className="flex flex-wrap items-center gap-4">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Status filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="deposit_paid">Deposit Paid</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={handleExport} disabled={filtered.length === 0}>
                  <Download className="mr-2 h-5 w-5" />
                  Export {filtered.length} inquiries
                </Button>
              </div>
              {state?.inquiryRef && (
                <p className="text-sm text-muted-foreground">
                  Redirected from inquiry {state.inquiryRef}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
