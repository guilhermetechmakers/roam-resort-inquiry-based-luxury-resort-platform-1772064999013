import { useState } from 'react'
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
import { Download } from 'lucide-react'
import { toast } from 'sonner'
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

export function CsvExportModal({
  open,
  onOpenChange,
  inquiries,
  fetchAllFiltered,
  appliedFilters = {},
  onSuccess,
}: CsvExportModalProps) {
  const [exportType, setExportType] = useState<AdminExportType>('inquiries')
  const [dateFrom, setDateFrom] = useState(appliedFilters.dateFrom ?? '')
  const [dateTo, setDateTo] = useState(appliedFilters.dateTo ?? '')
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      if (exportType === 'inquiries') {
        const list = fetchAllFiltered
          ? await fetchAllFiltered()
          : (Array.isArray(inquiries) ? inquiries : [])
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
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" aria-describedby="csv-export-desc">
        <DialogHeader>
          <DialogTitle>Export CSV</DialogTitle>
          <DialogDescription id="csv-export-desc">
            Configure export scope and date range. Download inquiries or reconciliation data for offline processing.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="export-type">Export type</Label>
            <Select
              value={exportType}
              onValueChange={(v) => setExportType(v as AdminExportType)}
            >
              <SelectTrigger id="export-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inquiries">Inquiries</SelectItem>
                <SelectItem value="reconciliations">Reconciliation data</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date-from">Date from</Label>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date-to">Date to</Label>
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            disabled={isExporting}
            aria-busy={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting…' : 'Export'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
