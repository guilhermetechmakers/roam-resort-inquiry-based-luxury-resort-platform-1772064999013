import { useEffect, useCallback, useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sidebar } from '@/components/layout/sidebar'
import { adminSidebarLinks } from '@/components/layout/sidebar-links'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/use-auth'
import {
  InquirySummaryCard,
  StatusControl,
  AdminInternalNotesPanel,
  PaymentPanel,
  ReconciliationPanel,
  ExportPanel,
} from '@/components/admin-concierge'
import { AdminInquiryTimeline } from '@/components/activity-timeline'
import {
  fetchAdminInquiryDetail,
  updateInquiryStatus,
  fetchInquiryInternalNotes,
  createInquiryInternalNote,
  updateInquiryInternalNote,
  deleteInquiryInternalNote,
  fetchInquiryPayments,
  fetchInquiryActivityLog,
  fetchInquiryReconciliations,
  createStripePaymentLink,
  markPaymentReceived,
  markInquiryPaymentReceived,
} from '@/api/admin-inquiry-detail'
import { createInternalNoteActivity, createActivity } from '@/api/activities'
import { shapeInquiryToAdmin, generateInquiriesCsv, generatePaymentsCsv, downloadCsv } from '@/api/admin'
import { formatDate } from '@/lib/utils'
import type { InquiryStatusValue } from '@/types/admin'

export function AdminInquiryDetailPage() {
  const { inquiryId } = useParams<{ inquiryId: string }>()
  const { hasRole, isLoading: authLoading, user } = useAuth()
  const queryClient = useQueryClient()

  const {
    data: inquiry,
    isLoading: inquiryLoading,
    isError: inquiryError,
    error: inquiryErr,
    refetch: refetchInquiry,
  } = useQuery({
    queryKey: ['admin-inquiry-detail', inquiryId],
    queryFn: () => fetchAdminInquiryDetail(inquiryId ?? ''),
    enabled: !!inquiryId,
  })

  const { data: notes = [], isLoading: notesLoading } = useQuery({
    queryKey: ['admin-inquiry-notes', inquiryId, inquiry?.internal_notes],
    queryFn: () =>
      fetchInquiryInternalNotes(
        inquiryId ?? '',
        typeof inquiry?.internal_notes === 'string' ? inquiry.internal_notes : undefined
      ),
    enabled: !!inquiryId && !inquiryLoading,
  })

  const { data: paymentsFromTable = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin-inquiry-payments', inquiryId],
    queryFn: () => fetchInquiryPayments(inquiryId ?? ''),
    enabled: !!inquiryId,
  })

  /** Synthesize payments from inquiry when inquiry_payments is empty but inquiry has payment_link */
  const payments = useMemo(() => {
    const fromTable = paymentsFromTable ?? []
    if (fromTable.length > 0) return fromTable
    if (inquiry?.payment_link) {
      return [
        {
          id: 'inquiry-payment',
          inquiryId: inquiryId ?? '',
          stripeLinkUrl: inquiry.payment_link,
          amount: inquiry.total_amount ?? 0,
          currency: 'USD',
          status: (inquiry.payment_state === 'paid' ? 'paid' : 'link_created') as 'pending' | 'link_created' | 'paid' | 'reconciled',
          createdAt: inquiry.updated_at ?? inquiry.created_at ?? '',
        },
      ]
    }
    return []
  }, [paymentsFromTable, inquiry, inquiryId])

  const { data: activityLog = [] } = useQuery({
    queryKey: ['admin-inquiry-activity', inquiryId],
    queryFn: () => fetchInquiryActivityLog(inquiryId ?? ''),
    enabled: !!inquiryId,
  })

  const {
    data: reconciliations = [],
    isLoading: reconciliationsLoading,
    isFetching: reconciliationsFetching,
    isError: reconciliationsError,
    error: reconciliationsErr,
    refetch: refetchReconciliations,
  } = useQuery({
    queryKey: ['admin-inquiry-reconciliations', inquiryId],
    queryFn: () => fetchInquiryReconciliations(inquiryId ?? ''),
    enabled: !!inquiryId,
  })

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: InquiryStatusValue }) => {
      const prevStatus = inquiry?.status ?? 'new'
      const updated = await updateInquiryStatus(id, status)
      try {
        await createActivity({
          inquiry_id: id,
          event_type: 'status_changed',
          actor_id: user?.id,
          actor_name: user?.full_name ?? user?.email ?? 'Staff',
          metadata: { from: prevStatus, to: status },
          is_internal: false,
        })
      } catch {
        // Activities table may not exist yet
      }
      return updated
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inquiry-detail', inquiryId] })
      queryClient.invalidateQueries({ queryKey: ['inquiries'] })
      queryClient.invalidateQueries({ queryKey: ['activities', inquiryId] })
      toast.success('Status updated')
    },
    onError: (err) => {
      toast.error((err as Error).message)
    },
  })

  const addNoteMutation = useMutation({
    mutationFn: async (text: string) => {
      await createInquiryInternalNote(
        inquiryId ?? '',
        text,
        user?.id ?? '',
        user?.full_name ?? user?.email ?? 'Staff'
      )
      try {
        await createInternalNoteActivity(
          inquiryId ?? '',
          text,
          user?.id ?? '',
          user?.full_name ?? user?.email ?? 'Staff'
        )
      } catch {
        // Activities table may not exist yet
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inquiry-notes', inquiryId] })
      queryClient.invalidateQueries({ queryKey: ['admin-inquiry-detail', inquiryId] })
      queryClient.invalidateQueries({ queryKey: ['activities', inquiryId] })
      toast.success('Note added')
    },
    onError: (err) => {
      toast.error((err as Error).message)
    },
  })

  const editNoteMutation = useMutation({
    mutationFn: ({ noteId, text }: { noteId: string; text: string }) =>
      updateInquiryInternalNote(inquiryId ?? '', noteId, text),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inquiry-notes', inquiryId] })
      toast.success('Note updated')
    },
    onError: (err) => {
      toast.error((err as Error).message)
    },
  })

  const deleteNoteMutation = useMutation({
    mutationFn: (noteId: string) =>
      deleteInquiryInternalNote(inquiryId ?? '', noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inquiry-notes', inquiryId] })
      toast.success('Note deleted')
    },
    onError: (err) => {
      toast.error((err as Error).message)
    },
  })

  const handleStatusChange = useCallback(
    (status: InquiryStatusValue) => {
      if (!inquiryId) return
      updateStatusMutation.mutate({ id: inquiryId, status })
    },
    [inquiryId, updateStatusMutation]
  )

  const handleAddNote = useCallback(
    async (text: string) => {
      await addNoteMutation.mutateAsync(text)
    },
    [addNoteMutation]
  )

  const handleEditNote = useCallback(
    async (noteId: string, text: string) => {
      await editNoteMutation.mutateAsync({ noteId, text })
    },
    [editNoteMutation]
  )

  const handleDeleteNote = useCallback(
    async (noteId: string) => {
      await deleteNoteMutation.mutateAsync(noteId)
    },
    [deleteNoteMutation]
  )

  const handleCreateStripeLink = useCallback(
    async (payload: import('@/types/admin').StripeLinkPayload) => {
      const result = await createStripePaymentLink(inquiryId ?? '', payload)
      queryClient.invalidateQueries({ queryKey: ['admin-inquiry-payments', inquiryId] })
      toast.success('Payment link created')
      return result
    },
    [inquiryId, queryClient]
  )

  const handleMarkPaymentReceived = useCallback(
    async (
      paymentId: string,
      options?: { notes?: string; reconciliationStatus?: 'pending' | 'paid' | 'confirmed' | 'reconciled' }
    ) => {
      if (paymentId === 'inquiry-payment') {
        await markInquiryPaymentReceived(inquiryId ?? '', options)
        queryClient.invalidateQueries({ queryKey: ['admin-inquiry-detail', inquiryId] })
      } else {
        await markPaymentReceived(inquiryId ?? '', paymentId, options)
      }
      queryClient.invalidateQueries({ queryKey: ['admin-inquiry-payments', inquiryId] })
      queryClient.invalidateQueries({ queryKey: ['admin-inquiry-reconciliations', inquiryId] })
      toast.success('Payment marked as received')
    },
    [inquiryId, queryClient]
  )

  const handleExportCsv = useCallback(() => {
    if (!inquiry) return
    const shaped = shapeInquiryToAdmin(inquiry)
    const csv = generateInquiriesCsv([shaped])
    downloadCsv(csv, `inquiry-${inquiry.reference ?? inquiry.id}-${new Date().toISOString().slice(0, 10)}.csv`)
    toast.success('CSV exported')
  }, [inquiry])

  const handleExportPaymentsCsv = useCallback(() => {
    if (!inquiryId || !inquiry) return
    const list = payments ?? []
    const rows = list.map((p) => ({
      id: p.id,
      inquiryId: p.inquiryId,
      amount: p.amount,
      currency: p.currency,
      status: p.status,
      stripeLinkUrl: p.stripeLinkUrl,
      createdAt: p.createdAt,
      expiresAt: p.expiresAt,
      reconciliationNotes: p.reconciliationNotes,
    }))
    const csv = generatePaymentsCsv(rows)
    downloadCsv(csv, `payments-${inquiry.reference ?? inquiryId}-${new Date().toISOString().slice(0, 10)}.csv`)
    toast.success('Payments CSV exported')
  }, [inquiry, inquiryId, payments])

  const handlePrint = useCallback(() => {
    window.print()
  }, [])

  useEffect(() => {
    document.title = inquiry
      ? `Inquiry ${inquiry.reference ?? inquiry.id} | Roam Resort`
      : 'Inquiry | Roam Resort'
    return () => {
      document.title = 'Roam Resort'
    }
  }, [inquiry])

  if (authLoading) return null
  if (!hasRole('concierge')) {
    return (
      <div
        className="flex min-h-[60vh] items-center justify-center"
        role="alert"
        aria-live="polite"
        aria-label="Access denied"
      >
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    )
  }

  if (!inquiryId) {
    return (
      <div
        className="flex min-h-[60vh] flex-col items-center justify-center"
        role="alert"
        aria-live="polite"
      >
        <p className="text-muted-foreground">Invalid inquiry.</p>
        <Link
          to="/admin/inquiries"
          className="mt-4 text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background rounded-md"
          aria-label="Back to inquiries list"
        >
          Back to Inquiries
        </Link>
      </div>
    )
  }

  if (inquiryLoading && !inquiry) {
    return (
      <div className="flex min-h-screen">
        <Sidebar links={adminSidebarLinks} title="Concierge" />
        <main className="flex-1 overflow-auto" aria-label="Inquiry detail loading">
          <div className="space-y-6 p-4 sm:p-6 md:p-8" role="status" aria-live="polite" aria-label="Loading inquiry details">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
              <div className="space-y-6 lg:col-span-2">
                <Skeleton className="h-64 rounded-xl" />
                <Skeleton className="h-80 rounded-xl" />
              </div>
              <div className="space-y-6">
                <Skeleton className="h-24 rounded-xl" />
                <Skeleton className="h-48 rounded-xl" />
                <Skeleton className="h-40 rounded-xl" />
                <Skeleton className="h-32 rounded-xl" />
              </div>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (inquiryError && !inquiry) {
    return (
      <div className="flex min-h-screen">
        <Sidebar links={adminSidebarLinks} title="Concierge" />
        <main className="flex-1 overflow-auto">
          <div
            className="flex min-h-[60vh] flex-col items-center justify-center p-4 sm:p-6 md:p-8"
            role="alert"
            aria-live="assertive"
          >
            <AlertCircle
              className="mb-4 h-12 w-12 text-destructive"
              aria-hidden
            />
            <h2 className="text-lg font-semibold text-foreground">
              Failed to load inquiry
            </h2>
            <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
              {(inquiryErr as Error)?.message ?? 'Something went wrong. Please try again.'}
            </p>
            <div className="mt-6 flex flex-wrap gap-3 justify-center">
              <Button
                variant="outline"
                onClick={() => refetchInquiry()}
                aria-label="Retry loading inquiry"
              >
                Try again
              </Button>
              <Button variant="secondary" asChild>
                <Link
                  to="/admin/inquiries"
                  className="inline-flex items-center gap-2"
                  aria-label="Back to inquiries list"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden />
                  Back to Inquiries
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (!inquiry) {
    return (
      <div className="flex min-h-screen">
        <Sidebar links={adminSidebarLinks} title="Concierge" />
        <main className="flex-1 overflow-auto">
          <div
            className="flex min-h-[60vh] flex-col items-center justify-center p-4 sm:p-6 md:p-8"
            role="status"
            aria-live="polite"
          >
            <p className="text-muted-foreground">Inquiry not found.</p>
            <Link
              to="/admin/inquiries"
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-accent-foreground transition-colors hover:bg-accent/90 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
              aria-label="Back to inquiries list"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden />
              Back to Inquiries
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen print:block">
      <Sidebar links={adminSidebarLinks} title="Concierge" className="print:hidden" />
      <main
        className="flex-1 overflow-auto print:flex-1"
        aria-labelledby="inquiry-detail-heading"
      >
        <div className="p-4 sm:p-6 md:p-8 print:p-4">
          <Link
            to="/admin/inquiries"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background rounded-md print:hidden"
            aria-label="Back to inquiries list"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back to Inquiries
          </Link>

          <div className="mb-6 md:mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1
                className="font-serif text-2xl sm:text-3xl font-bold animate-in fade-in slide-in-from-bottom-2 duration-300"
                id="inquiry-detail-heading"
              >
                {inquiry.reference ?? inquiry.id}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Created {formatDate(inquiry.created_at ?? '')}
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <InquirySummaryCard inquiry={inquiry} />

              <AdminInquiryTimeline
                inquiryId={inquiryId}
                inquiry={inquiry}
                notes={notes ?? []}
                payments={payments ?? []}
                activityLog={activityLog ?? []}
              />
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover">
                <StatusControl
                  currentStatus={(inquiry.status ?? 'new') as InquiryStatusValue}
                  onChange={handleStatusChange}
                  disabled={updateStatusMutation.isPending}
                />
              </div>

              <AdminInternalNotesPanel
                notes={notes ?? []}
                onAdd={handleAddNote}
                onEdit={handleEditNote}
                onDelete={handleDeleteNote}
                isLoading={notesLoading}
                canEdit
              />

              <PaymentPanel
                payments={payments ?? []}
                onCreateStripeLink={handleCreateStripeLink}
                onMarkReceived={
                  payments?.some((p) => p.status !== 'paid')
                    ? (paymentId, options) => handleMarkPaymentReceived(paymentId, options)
                    : undefined
                }
                isLoading={paymentsLoading}
              />

              <ReconciliationPanel
                reconciliations={reconciliations ?? []}
                isLoading={reconciliationsLoading}
                onRefresh={async () => { await refetchReconciliations() }}
                isRefreshing={reconciliationsFetching}
                error={reconciliationsError ? (reconciliationsErr as Error) : null}
                onRetry={() => refetchReconciliations()}
              />

              <ExportPanel
                inquiry={inquiry}
                onExportCsv={handleExportCsv}
                onExportPaymentsCsv={handleExportPaymentsCsv}
                onPrint={handlePrint}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
