import { useMemo } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { Inquiry } from '@/types'

export interface DataVisualizationPanelProps {
  inquiries: Inquiry[]
  isLoading?: boolean
  className?: string
}

function groupByMonth(items: Inquiry[]): { month: string; count: number }[] {
  const map = new Map<string, number>()
  const list = Array.isArray(items) ? items : []
  for (const i of list) {
    const d = i.created_at ? new Date(i.created_at) : new Date()
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    map.set(key, (map.get(key) ?? 0) + 1)
  }
  const sorted = [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  return sorted.slice(-6).map(([month, count]) => ({ month, count }))
}

function groupByStatus(items: Inquiry[]): { status: string; count: number }[] {
  const map = new Map<string, number>()
  const list = Array.isArray(items) ? items : []
  for (const i of list) {
    const s = i.status ?? 'unknown'
    map.set(s, (map.get(s) ?? 0) + 1)
  }
  const labels: Record<string, string> = {
    new: 'New',
    contacted: 'Contacted',
    deposit_paid: 'Deposit Paid',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
  }
  return [...map.entries()].map(([status, count]) => ({
    status: labels[status] ?? status,
    count,
  }))
}

const CHART_COLORS = {
  primary: 'rgb(169, 124, 80)',
  secondary: 'rgb(180, 149, 135)',
  grid: 'rgb(209, 183, 161 / 0.3)',
}

export function DataVisualizationPanel({
  inquiries,
  isLoading,
  className,
}: DataVisualizationPanelProps) {
  const lineData = useMemo(() => groupByMonth(inquiries ?? []), [inquiries])
  const barData = useMemo(() => groupByStatus(inquiries ?? []), [inquiries])

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={cn('grid gap-6 lg:grid-cols-2', className)}>
      <Card className="overflow-hidden">
        <CardHeader>
          <h3 className="font-serif text-lg font-semibold">Inquiries over time</h3>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 12 }}
                  stroke="rgb(var(--muted-foreground) / 0.5)"
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  stroke="rgb(var(--muted-foreground) / 0.5)"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(var(--card))',
                    border: '1px solid rgb(var(--border))',
                    borderRadius: '8px',
                  }}
                  labelStyle={{ fontFamily: 'Playfair Display, serif' }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={CHART_COLORS.primary}
                  strokeWidth={2}
                  dot={{ fill: CHART_COLORS.primary, r: 4 }}
                  name="Inquiries"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="overflow-hidden">
        <CardHeader>
          <h3 className="font-serif text-lg font-semibold">By status</h3>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} layout="vertical" margin={{ left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
                <XAxis
                  type="number"
                  tick={{ fontSize: 12 }}
                  stroke="rgb(var(--muted-foreground) / 0.5)"
                />
                <YAxis
                  type="category"
                  dataKey="status"
                  width={90}
                  tick={{ fontSize: 11 }}
                  stroke="rgb(var(--muted-foreground) / 0.5)"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgb(var(--card))',
                    border: '1px solid rgb(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Bar
                  dataKey="count"
                  fill={CHART_COLORS.secondary}
                  radius={[0, 4, 4, 0]}
                  name="Count"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
