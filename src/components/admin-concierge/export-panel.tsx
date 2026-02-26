import { FileDown, FileText, Printer, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Inquiry } from '@/types'

export interface ExportPanelProps {
  inquiry: Inquiry | null
  onExportCsv: () => void
  onExportPaymentsCsv?: () => void
  onExportPdf?: () => void
  onPrint?: () => void
  className?: string
}

export function ExportPanel({
  inquiry,
  onExportCsv,
  onExportPaymentsCsv,
  onExportPdf,
  onPrint,
  className,
}: ExportPanelProps) {
  const handlePrint = () => {
    if (onPrint) {
      onPrint()
    } else {
      window.print()
    }
  }

  return (
    <Card className={cn('transition-all duration-300', className)}>
      <CardHeader>
        <h3 className="font-serif text-lg font-semibold">Export & print</h3>
        <p className="text-sm text-muted-foreground">
          Download or print inquiry details
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 border-accent/40 hover:bg-accent/10"
          onClick={onExportCsv}
          disabled={!inquiry}
        >
          <FileDown className="h-4 w-4" />
          Export CSV
        </Button>
        {onExportPaymentsCsv && (
          <Button
            variant="outline"
            className="w-full justify-start gap-2 border-accent/40 hover:bg-accent/10"
            onClick={onExportPaymentsCsv}
            disabled={!inquiry}
          >
            <Wallet className="h-4 w-4" />
            Export payments CSV
          </Button>
        )}
        {onExportPdf && (
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={onExportPdf}
            disabled={!inquiry}
          >
            <FileText className="h-4 w-4" />
            Export PDF
          </Button>
        )}
        <Button
          variant="outline"
          className="w-full justify-start gap-2"
          onClick={handlePrint}
          disabled={!inquiry}
        >
          <Printer className="h-4 w-4" />
          Print
        </Button>
      </CardContent>
    </Card>
  )
}
