import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Download, FileSpreadsheet, Inbox, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { AdminExportType } from '@/types/admin'
import {
  generateInquiriesCsv,
  generateReconciliationsCsv,
  downloadCsv,
  fetchAdminReconciliations,
} from '@/api/admin'
import { shapeInquiryToAdmin } from '@/api/admin'
import type { Inquiry } from '@/types'

export interface CsvExportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inquiries: Inquiry[]
  /** When provided, fetches all filtered inquiries for export (for paginated lists) */
  fetchAllFiltered?: () => Promise<Inquiry[]>
  appliedFilters?: {
    status?: string
    destination?: string
    dateFrom?: string
    dateTo?: string
  }
  onSuccess?: () => void
}

function getGuestDisplayName(inquiry: Inquiry): string {
  const guest = typeof inquiry.guest === 'object' ? inquiry.guest : null
  return guest?.full_name ?? guest?.email ?? 'Guest'
}

function getDestinationName(inquiry: Inquiry): string {
  const listing = typeof inquiry.listing === 'object' ? inquiry.listing : null
  return listing?.title ?? 'Destination'
}

export function CsvExportModal({
  open,
  onOpenChange,
  inquiries,
  fetchAllFiltered,
  appliedFilters = {},
  onSuccess,
}: CsvExportModalProps) {
  const navigate = useNavigate()
  const [exportType, setExportType] = useState<AdminExportType>('inquiries')
  const [dateFrom, setDateFrom] = useState(appliedFilters.dateFrom ?? '')
  const [dateTo, setDateTo] = useState(appliedFilters.dateTo ?? '')
  const [isExporting, setIsExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const inquiryList = Array.isArray(inquiries) ? inquiries : []
  const hasInquiries = inquiryList.length > 0

  useEffect(() => {
    setDateFrom(appliedFilters.dateFrom ?? '')
    setDateTo(appliedFilters.dateTo ?? '')
  }, [appliedFilters.dateFrom, appliedFilters.dateTo])

  useEffect(() => {
    if (open) {
      setExportError(null)
    }
  }, [open])

  const handleExportTypeChange = (v: string) => {
    setExportType(v as AdminExportType)
    setExportError(null)
  }

  const handleExport = async () => {
    setExportError(null)
    setIsExporting(true)
    try {
      if (exportType === 'inquiries') {
        const list = fetchAllFiltered
          ? await fetchAllFiltered()
          : inquiryList
        const shaped = (list ?? []).map((i) => shapeInquiryToAdmin(i))
        const csv = generateInquiriesCsv(shaped)
        const filename = `inquiries-export-${new Date().toISOString().slice(0, 10)}.csv`
        downloadCsv(csv, filename)
        toast.success(`Exported ${shaped.length} inquiries`)
        onSuccess?.()
      } else {
        const { data } = await fetchAdminReconciliations({
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
        })
        const csv = generateReconciliationsCsv(data ?? [])
        const filename = `reconciliations-export-${new Date().toISOString().slice(0, 10)}.csv`
        downloadCsv(csv, filename)
        toast.success(`Exported ${(data ?? []).length} reconciliation records`)
        onSuccess?.()
      }
      onOpenChange(false)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Export failed. Please try again.'
      setExportError(message)
      toast.error(message)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        aria-describedby="csv-export-desc"
        aria-labelledby="csv-export-title"
      >
        <DialogHeader>
          <DialogTitle id="csv-export-title">Export CSV</DialogTitle>
          <DialogDescription id="csv-export-desc">
            Configure export scope and date range. Download inquiries or
            reconciliation data for offline processing.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {exportError && (
            <div
              role="alert"
              aria-live="assertive"
              className={cn(
                'flex items-start gap-3 rounded-lg border border-destructive/30',
                'bg-destructive/10 p-4 text-destructive animate-fade-in'
              )}
            >
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
              <p className="text-sm font-medium flex-1 min-w-0">{exportError}</p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="export-type">Export type</Label>
            <Select value={exportType} onValueChange={handleExportTypeChange}>
              <SelectTrigger
                id="export-type"
                aria-label="Select export type"
                aria-describedby="export-type-desc"
              >
                <SelectValue placeholder="Select export type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inquiries">Inquiries</SelectItem>
                <SelectItem value="reconciliations">Reconciliation data</SelectItem>
              </SelectContent>
            </Select>
            <span id="export-type-desc" className="sr-only">
              Choose between exporting inquiries or reconciliation data
            </span>
          </div>

          {exportType === 'inquiries' && (
            <div className="space-y-2">
              <Label id="inquiries-list-label">Inquiries to export</Label>
              <div
                className="rounded-lg border border-border bg-muted/30"
                role="region"
                aria-labelledby="inquiries-list-label"
              >
                {hasInquiries ? (
                  <ul
                    className="max-h-40 overflow-y-auto divide-y divide-border"
                    role="list"
                  >
                    {inquiryList.slice(0, 20).map((inquiry) => (
                      <li
                        key={inquiry.id}
                        className="flex items-center justify-between gap-2 px-4 py-2 text-sm"
                      >
                        <span className="truncate text-foreground">
                          {getGuestDisplayName(inquiry)} →{' '}
                          {getDestinationName(inquiry)}
                        </span>
                        <span className="shrink-0 text-muted-foreground">
                          {inquiry.reference ?? inquiry.id.slice(0, 8)}
                        </span>
                      </li>
                    ))}
                    {inquiryList.length > 20 && (
                      <li className="px-4 py-2 text-sm text-muted-foreground">
                        +{inquiryList.length - 20} more
                        {fetchAllFiltered &&
                          ' (export will include all filtered)'}
                      </li>
                    )}
                  </ul>
                ) : (
                  <div
                    className="flex flex-col items-center justify-center py-12 px-6 text-center"
                    role="status"
                    aria-live="polite"
                  >
                    <div
                      className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted"
                      aria-hidden
                    >
                      <Inbox className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <h4 className="font-serif text-sm font-semibold text-foreground">
                      No inquiries to export
                    </h4>
                    <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                      {fetchAllFiltered
                        ? 'No inquiries in current view. Export will fetch all filtered inquiries when you click Export.'
                        : 'Add or select inquiries to include in your export.'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-from">Date from</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                aria-label="Export date range start"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">Date to</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                aria-label="Export date range end"
              />
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col gap-4 sm:flex-row sm:justify-between">
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false)
              navigate('/admin/exports')
            }}
            className="border-accent/50 text-accent hover:bg-accent/10 focus-visible:ring-accent"
            aria-label="Go to server export (advanced)"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" aria-hidden />
            Server export (advanced)
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              aria-label="Cancel export"
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              aria-busy={isExporting}
              aria-label={isExporting ? 'Exporting…' : 'Export CSV now'}
              className="bg-accent text-accent-foreground hover:bg-accent/90 focus-visible:ring-accent"
            >
              <Download className="mr-2 h-4 w-4" aria-hidden />
              {isExporting ? 'Exporting…' : 'Export now'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
