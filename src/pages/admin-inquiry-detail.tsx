import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Sidebar, adminSidebarLinks } from '@/components/layout/sidebar'
import { useAuth } from '@/contexts/auth-context'
import { useAdminInquiries, useUpdateInquiry } from '@/hooks/use-inquiries'
import { InquiryStatusPanel } from '@/components/inquiry'
import { formatDate } from '@/lib/utils'
import type { Inquiry, InquiryStatus } from '@/types'

function exportInquiryToCsv(inquiry: Inquiry): void {
  const rows = [
    ['Reference', 'Listing', 'Check-in', 'Check-out', 'Guests', 'Status', 'Created'],
    [
      inquiry.reference,
      typeof inquiry.listing === 'object' && inquiry.listing ? inquiry.listing.title : '—',
      inquiry.check_in ?? '—',
      inquiry.check_out ?? '—',
      String(inquiry.guests_count ?? '—'),
      inquiry.status,
      inquiry.created_at ?? '—',
    ],
  ]
  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `inquiry-${inquiry.reference}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function AdminInquiryDetailPage() {
  const { inquiryId } = useParams<{ inquiryId: string }>()
  const { hasRole, isLoading: authLoading } = useAuth()
  const { data: inquiries } = useAdminInquiries()
  const updateInquiry = useUpdateInquiry()
  const inquiry = (inquiries ?? []).find((i) => i.id === inquiryId)

  const handleStatusChange = (id: string, status: InquiryStatus) => {
    if (!id) return
    updateInquiry.mutate(
      { id, payload: { status } },
      {
        onSuccess: () => toast.success('Status updated'),
        onError: (err) => toast.error((err as Error).message),
      }
    )
  }

  const handleNotesChange = (id: string, notes: string) => {
    if (!id) return
    updateInquiry.mutate(
      { id, payload: { internal_notes: notes } },
      {
        onSuccess: () => toast.success('Notes saved'),
        onError: (err) => toast.error((err as Error).message),
      }
    )
  }

  const handleExport = () => {
    if (inquiry) exportInquiryToCsv(inquiry)
  }

  if (authLoading) return null
  if (!hasRole('concierge')) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    )
  }

  if (!inquiry) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <p className="text-muted-foreground">Inquiry not found.</p>
        <Link to="/admin/inquiries" className="mt-4">
          <Button>Back to Inquiries</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar links={adminSidebarLinks} title="Concierge" />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <Link
            to="/admin/inquiries"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Inquiries
          </Link>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card>
                <CardHeader>
                  <h2 className="font-serif text-xl font-semibold">{inquiry.reference}</h2>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground">Listing</Label>
                    <p className="font-medium">
                      {typeof inquiry.listing === 'object' && inquiry.listing
                        ? inquiry.listing.title
                        : '—'}
                    </p>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label className="text-muted-foreground">Check-in</Label>
                      <p>{inquiry.check_in ? formatDate(inquiry.check_in) : '—'}</p>
                    </div>
                    <div>
                      <Label className="text-muted-foreground">Check-out</Label>
                      <p>{inquiry.check_out ? formatDate(inquiry.check_out) : '—'}</p>
                    </div>
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Guests</Label>
                    <p>{inquiry.guests_count ?? '—'}</p>
                  </div>
                  {(inquiry.room_prefs ?? []).length > 0 && (
                    <div>
                      <Label className="text-muted-foreground">Room Preferences</Label>
                      <p>{(inquiry.room_prefs ?? []).join(', ')}</p>
                    </div>
                  )}
                  {inquiry.budget_hint && (
                    <div>
                      <Label className="text-muted-foreground">Budget Hint</Label>
                      <p>{inquiry.budget_hint}</p>
                    </div>
                  )}
                  {inquiry.message && (
                    <div>
                      <Label className="text-muted-foreground">Message</Label>
                      <p className="mt-1 whitespace-pre-wrap">{inquiry.message}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="font-serif font-semibold">Status & Actions</h3>
                </CardHeader>
                <CardContent>
                  <InquiryStatusPanel
                    inquiry={inquiry}
                    onStatusChange={handleStatusChange}
                    onNotesChange={handleNotesChange}
                    onExport={handleExport}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="font-serif font-semibold">Payment</h3>
                </CardHeader>
                <CardContent>
                  <p className="mb-4 text-sm text-muted-foreground">
                    Create a Stripe payment link and send to the guest. (Placeholder for Stripe
                    Connect integration)
                  </p>
                  <Button className="w-full" disabled>
                    Create Payment Link
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="font-serif font-semibold">Activity</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Inquiry created {formatDate(inquiry.created_at)}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
