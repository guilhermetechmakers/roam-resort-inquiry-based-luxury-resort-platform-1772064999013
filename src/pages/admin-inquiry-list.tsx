import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
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
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

const statusOptions = ['new', 'contacted', 'deposit_paid', 'confirmed', 'cancelled']

export function AdminInquiryListPage() {
  const { hasRole, isLoading: authLoading } = useAuth()
  const { data: inquiries, isLoading } = useAdminInquiries()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  if (authLoading) return null
  if (!hasRole('concierge')) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    )
  }

  const filtered = (inquiries ?? []).filter((i) => {
    const matchSearch =
      !search ||
      i.reference.toLowerCase().includes(search.toLowerCase()) ||
      (typeof i.listing === 'object' && i.listing?.title?.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = statusFilter === 'all' || i.status === statusFilter
    return matchSearch && matchStatus
  })

  return (
    <div className="flex min-h-screen">
      <Sidebar links={adminSidebarLinks} title="Concierge" />
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <h1 className="font-serif text-3xl font-bold">Inquiries</h1>
          <p className="mt-2 text-muted-foreground">
            Manage all stay inquiries and create payment links.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by reference or listing..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.replace('_', ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="mt-6 space-y-2">
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-lg" />
                ))
              : filtered.map((inquiry) => (
                  <Link key={inquiry.id} to={`/admin/inquiries/${inquiry.id}`}>
                    <Card className="transition-colors hover:bg-secondary/50">
                      <CardContent className="flex items-center justify-between py-4">
                        <div>
                          <span className="font-mono text-sm text-muted-foreground">
                            {inquiry.reference}
                          </span>
                          <p className="font-medium">
                            {typeof inquiry.listing === 'object' && inquiry.listing
                              ? inquiry.listing.title
                              : 'Destination'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {inquiry.check_in && formatDate(inquiry.check_in)} –{' '}
                            {inquiry.check_out && formatDate(inquiry.check_out)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'rounded-full px-2 py-1 text-xs',
                            inquiry.status === 'new' && 'bg-blue-100 text-blue-800',
                            inquiry.status === 'contacted' && 'bg-amber-100 text-amber-800',
                            inquiry.status === 'deposit_paid' && 'bg-green-100 text-green-800',
                            inquiry.status === 'confirmed' && 'bg-green-100 text-green-800',
                            inquiry.status === 'cancelled' && 'bg-gray-100 text-gray-800'
                          )}
                        >
                          {inquiry.status.replace('_', ' ')}
                        </span>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
          </div>

          {!isLoading && filtered.length === 0 && (
            <Card className="mt-6">
              <CardContent className="py-12 text-center text-muted-foreground">
                No inquiries match your filters.
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  )
}
