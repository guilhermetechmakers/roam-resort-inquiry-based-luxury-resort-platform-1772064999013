import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { formatDate } from '@/lib/utils'

const statusOptions = ['new', 'contacted', 'deposit_paid', 'confirmed', 'cancelled']

export function AdminInquiryDetailPage() {
  const { inquiryId } = useParams<{ inquiryId: string }>()
  const { hasRole, isLoading: authLoading } = useAuth()
  const { data: inquiries } = useAdminInquiries()
  const inquiry = inquiries?.find((i) => i.id === inquiryId)

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
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Inquiries
          </Link>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-xl font-semibold">
                      {inquiry.reference}
                    </h2>
                    <Select defaultValue={inquiry.status}>
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((s) => (
                          <SelectItem key={s} value={s}>
                            {s.replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
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
                  {inquiry.message && (
                    <div>
                      <Label className="text-muted-foreground">Message</Label>
                      <p className="mt-1 whitespace-pre-wrap">{inquiry.message}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <h3 className="font-serif font-semibold">Internal Notes</h3>
                </CardHeader>
                <CardContent>
                  <Textarea
                    placeholder="Add internal notes (concierge only)..."
                    rows={4}
                  />
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <h3 className="font-serif font-semibold">Payment</h3>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create a Stripe payment link and send to the guest.
                  </p>
                  <Button className="w-full">Create Payment Link</Button>
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
