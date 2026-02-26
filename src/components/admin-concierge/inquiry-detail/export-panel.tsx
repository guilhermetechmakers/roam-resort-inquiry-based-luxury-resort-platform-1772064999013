/**
 * ExportPanel - CSV/PDF export and print triggers.
 * Fetches sanitized data; handles null safely.
 */

import { Download, FileText, Printer } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { downloadCsv, exportInquiryCsv, printInquiryDetail } from '@/api/admin'
import type { AdminInquiryDetail } from '@/types/admin'
import { cn } from '@/lib/utils'

export interface ExportPanelProps {
  inquiry: AdminInquiryDetail | null
  onExportCsv?: () => void
  onExportPdf?: () => void
  onPrint?: () => void
  className?: string
}

export function ExportPanel({
  inquiry,
  onExportCsv,
  onExportPdf,
  onPrint,
  className,
}: ExportPanelProps) {
  const reference = inquiry?.reference ?? inquiry?.id ?? 'inquiry'
  const safeDate = new Date().toISOString().slice(0, 10)

  const handleCsv = () => {
    if (!inquiry) return
    const csv = exportInquiryCsv(inquiry)
    downloadCsv(csv, `inquiry-${reference}-${safeDate}.csv`)
    onExportCsv?.()
  }

  const handlePrint = () => {
    printInquiryDetail()
    onPrint?.()
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      <CardHeader className="border-b border-border/50">
        <h3 className="font-serif text-lg font-semibold">Export</h3>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 pt-6">
        <Button
          variant="outline"
          className="w-full justify-start border-accent/30 hover:bg-accent/10"
          onClick={handleCsv}
          disabled={!inquiry}
        >
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start border-accent/30 hover:bg-accent/10"
          onClick={handlePrint}
          disabled={!inquiry}
        >
          <Printer className="mr-2 h-4 w-4" />
          Print view
        </Button>
        {onExportPdf && (
          <Button
            variant="outline"
            className="w-full justify-start border-accent/30 hover:bg-accent/10"
            onClick={onExportPdf}
            disabled={!inquiry}
          >
            <FileText className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
