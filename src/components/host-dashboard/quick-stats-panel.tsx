import { MessageSquare, Eye, Calendar } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatDate } from '@/lib/utils'
import type { HostStats } from '@/api/host-dashboard'
import { cn } from '@/lib/utils'

export interface QuickStatsPanelProps {
  stats: HostStats | undefined
  isLoading?: boolean
  className?: string
}

const statConfig = [
  {
    key: 'totalInquiries',
    label: 'Total Inquiries',
    icon: MessageSquare,
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: 'totalViews',
    label: 'Total Views',
    icon: Eye,
    format: (v: number) => v.toLocaleString(),
  },
  {
    key: 'lastInquiryDate',
    label: 'Last Inquiry',
    icon: Calendar,
    format: (v: string | null) => (v ? formatDate(v) : '—'),
  },
] as const

export function QuickStatsPanel({
  stats,
  isLoading,
  className,
}: QuickStatsPanelProps) {
  return (
    <div
      className={cn('grid gap-4 sm:grid-cols-3', className)}
      role="region"
      aria-label="Quick statistics"
    >
      {statConfig.map(({ key, label, icon: Icon, format }) => (
        <Card
          key={key}
          className="overflow-hidden transition-all duration-300 hover:shadow-card-hover hover:border-accent/30"
        >
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <span className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </span>
            <Icon className="h-5 w-5 text-accent" aria-hidden />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <span className="font-serif text-2xl font-bold text-foreground">
                {key === 'lastInquiryDate'
                  ? format(stats?.lastInquiryDate ?? null)
                  : format((stats?.[key] as number) ?? 0)}
              </span>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
