/**
 * Admin CSV Export / Reports page.
 * Configure and trigger CSV exports for inquiries and reconciliation data.
 */

import { useState, useRef } from 'react'
import { toast } from 'sonner'
import { Sidebar } from '@/components/layout/sidebar'
import { adminSidebarLinks } from '@/components/layout/sidebar-links'
import { useAuth } from '@/hooks/use-auth'
import {
  ExportBuilderPanel,
  ExportsList,
  ExportJobModal,
} from '@/components/admin-export'
import {
  useExportsList,
  useCreateExport,
  useRetryExport,
  useCancelExport,
} from '@/hooks/use-admin-export'

export function AdminExportsPage() {
  const { hasRole, isLoading: authLoading } = useAuth()
  const { data: exports = [], isLoading: exportsLoading, refetch } = useExportsList()
  const createExport = useCreateExport()
  const retryExport = useRetryExport()
  const cancelExport = useCancelExport()

  const [modalState, setModalState] = useState<{
    open: boolean
    action: 'retry' | 'cancel'
    exportId: string | null
  }>({ open: false, action: 'retry', exportId: null })

  const exportBuilderRef = useRef<HTMLDivElement>(null)

  const handleSubmitExport = (config: {
    dataset: 'inquiries' | 'reconciliation' | 'both'
    fields: string[]
    dateFrom: string
    dateTo: string
    filters: { status?: string; hostId?: string; destinationId?: string; search?: string }
    delimiter?: string
    includeHeaders?: boolean
  }) => {
    const basePayload = {
      dateFrom: config.dateFrom,
      dateTo: config.dateTo,
      filters: config.filters ?? {},
      delimiter: config.delimiter ?? ',',
      includeHeaders: config.includeHeaders ?? true,
    }
    const toastId = toast.loading('Creating export job…')
    const onSettled = () => {
      toast.dismiss(toastId)
      void refetch()
    }
    if (config.dataset === 'both') {
      const inquiryFields = (config.fields ?? []).filter((f) => f.startsWith('inquiry_')).map((f) => f.replace(/^inquiry_/, ''))
      const reconFields = (config.fields ?? []).filter((f) => f.startsWith('recon_')).map((f) => f.replace(/^recon_/, ''))
      if (inquiryFields.length > 0) {
        createExport.mutate(
          { ...basePayload, dataset: 'inquiries', fields: inquiryFields },
          { onSettled }
        )
      }
      if (reconFields.length > 0) {
        createExport.mutate(
          { ...basePayload, dataset: 'reconciliation', fields: reconFields },
          { onSettled }
        )
      }
      if (inquiryFields.length === 0 && reconFields.length === 0) {
        toast.dismiss(toastId)
      }
    } else {
      createExport.mutate(
        {
          ...basePayload,
          dataset: config.dataset,
          fields: config.fields,
        },
        { onSettled }
      )
    }
  }

  const handleRetry = (exportId: string) => {
    setModalState({ open: true, action: 'retry', exportId })
  }

  const handleCancel = (exportId: string) => {
    setModalState({ open: true, action: 'cancel', exportId })
  }

  const handleModalConfirm = (exportId: string) => {
    const toastId = toast.loading(modalState.action === 'retry' ? 'Retrying export…' : 'Cancelling export…')
    const onSettled = () => {
      toast.dismiss(toastId)
      void refetch()
    }
    if (modalState.action === 'retry') {
      retryExport.mutate(exportId, { onSettled })
    } else {
      cancelExport.mutate(exportId, { onSettled })
    }
  }

  if (authLoading) return null
  if (!hasRole('concierge')) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar links={adminSidebarLinks} title="Concierge" />
      <main className="flex-1 overflow-auto" role="main" aria-label="CSV Export and Reports">
        {exportsLoading && (
          <div
            className="h-1 w-full overflow-hidden bg-muted"
            role="progressbar"
            aria-label="Loading exports"
            aria-busy="true"
          >
            <div className="h-full w-1/3 animate-loading-bar bg-accent" />
          </div>
        )}
        <div className="p-4 sm:p-6 lg:p-8">
          <header className="mb-8">
            <h1 className="font-serif text-3xl font-bold text-foreground">CSV Export / Reports</h1>
            <p className="mt-2 text-muted-foreground">
              Build custom CSV exports for inquiries and payment reconciliation data.
              Select fields, apply filters, and download when ready.
            </p>
          </header>

          <div className="space-y-8">
            <section ref={exportBuilderRef} aria-labelledby="export-builder-heading">
              <ExportBuilderPanel
                headingId="export-builder-heading"
                onSubmitExport={handleSubmitExport}
                isSubmitting={createExport.isPending}
              />
            </section>

            <section aria-labelledby="exports-list-heading" aria-busy={exportsLoading}>
              <ExportsList
                exports={exports}
                isLoading={exportsLoading}
                onRetry={handleRetry}
                onCancel={handleCancel}
                onScrollToBuilder={() =>
                  exportBuilderRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              />
            </section>
          </div>

          <section
            className="mt-12 rounded-xl border border-border bg-muted/30 p-6 shadow-sm"
            aria-labelledby="export-tips-heading"
          >
            <h3 id="export-tips-heading" className="font-serif text-lg font-semibold text-foreground">Export tips</h3>
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
              <li>Select only the fields you need to keep file size manageable.</li>
              <li>Use date range presets for common periods like Last 30 days.</li>
              <li>Filter by status or destination to narrow results.</li>
              <li>Downloads are available for 24 hours after completion.</li>
            </ul>
          </section>
        </div>
      </main>

      <ExportJobModal
        open={modalState.open}
        onOpenChange={(open) => setModalState((s) => ({ ...s, open }))}
        action={modalState.action}
        exportId={modalState.exportId}
        onConfirm={handleModalConfirm}
        isLoading={
          (modalState.action === 'retry' && retryExport.isPending) ||
          (modalState.action === 'cancel' && cancelExport.isPending)
        }
      />
    </div>
  )
}
