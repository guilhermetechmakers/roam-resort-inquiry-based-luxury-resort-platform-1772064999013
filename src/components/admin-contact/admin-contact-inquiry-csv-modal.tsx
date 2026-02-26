import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { generateContactInquiriesCsv, downloadCsv } from '@/lib/contact-inquiry-export'
import type { ContactInquiry } from '@/types/contact-inquiry'

export interface AdminContactInquiryCsvModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inquiries: ContactInquiry[]
  appliedFilters?: { status?: string; type?: string }
}

export function AdminContactInquiryCsvModal({
  open,
  onOpenChange,
  inquiries,
  appliedFilters,
}: AdminContactInquiryCsvModalProps) {
  const list = Array.isArray(inquiries) ? inquiries : []

  const handleExport = () => {
    const csv = generateContactInquiriesCsv(list)
    const filters = []
    if (appliedFilters?.status) filters.push(`status-${appliedFilters.status}`)
    if (appliedFilters?.type) filters.push(`type-${appliedFilters.type}`)
    const suffix = filters.length > 0 ? `-${filters.join('-')}` : ''
    downloadCsv(csv, `contact-inquiries${suffix}-${new Date().toISOString().slice(0, 10)}.csv`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Contact Inquiries</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-4">
          <p className="text-sm text-muted-foreground">
            Export {list.length} contact inquiry{list.length !== 1 ? 'ies' : ''} to CSV.
            {appliedFilters?.status && (
              <span className="block mt-1">
                Filter: status = {appliedFilters.status}
                {appliedFilters?.type && `, type = ${appliedFilters.type}`}
              </span>
            )}
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={list.length === 0}
              className="bg-accent hover:bg-accent/90"
            >
              Download CSV
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
