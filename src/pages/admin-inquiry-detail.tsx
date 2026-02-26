import { useEffect, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Sidebar, adminSidebarLinks } from '@/components/layout/sidebar'
import { useAuth } from '@/contexts/auth-context'
import {
  InquirySummaryCard,
  StatusControl,
  AdminInternalNotesPanel,
  PaymentPanel,
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
  createStripePaymentLink,
  markPaymentReceived,
} from '@/api/admin-inquiry-detail'
import { createInternalNoteActivity, createActivity } from '@/api/activities'
import { shapeInquiryToAdmin, generateInquiriesCsv, downloadCsv } from '@/api/admin'
import { formatDate } from '@/lib/utils'
import type { InquiryStatusValue } from '@/types/admin'

export function AdminInquiryDetailPage() {
  const { inquiryId } = useParams<{ inquiryId: string }>()
  const { hasRole, isLoading: authLoading, user } = useAuth()
  const queryClient = useQueryClient()

  const { data: inquiry, isLoading: inquiryLoading } = useQuery({
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

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['admin-inquiry-payments', inquiryId],
    queryFn: () => fetchInquiryPayments(inquiryId ?? ''),
    enabled: !!inquiryId,
  })

  const { data: activityLog = [] } = useQuery({
    queryKey: ['admin-inquiry-activity', inquiryId],
    queryFn: () => fetchInquiryActivityLog(inquiryId ?? ''),
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
    async (paymentId: string) => {
      await markPaymentReceived(inquiryId ?? '', paymentId)
      queryClient.invalidateQueries({ queryKey: ['admin-inquiry-payments', inquiryId] })
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
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    )
  }

  if (!inquiryId) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <p className="text-muted-foreground">Invalid inquiry.</p>
        <Link to="/admin/inquiries" className="mt-4">
          <span className="text-accent hover:underline">Back to Inquiries</span>
        </Link>
      </div>
    )
  }

  if (inquiryLoading && !inquiry) {
    return (
      <div className="flex min-h-screen">
        <Sidebar links={adminSidebarLinks} title="Concierge" />
        <main className="flex-1 overflow-auto">
          <div className="animate-pulse space-y-6 p-8">
            <div className="h-8 w-48 rounded bg-muted" />
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="h-64 rounded-xl bg-muted lg:col-span-2" />
              <div className="h-64 rounded-xl bg-muted" />
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
          <div className="flex min-h-[60vh] flex-col items-center justify-center p-8">
            <p className="text-muted-foreground">Inquiry not found.</p>
            <Link to="/admin/inquiries" className="mt-4">
              <span className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2 text-accent-foreground transition-colors hover:bg-accent/90">
                <ArrowLeft className="h-4 w-4" />
                Back to Inquiries
              </span>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen print:block">
      <Sidebar links={adminSidebarLinks} title="Concierge" className="print:hidden" />
      <main className="flex-1 overflow-auto print:flex-1">
        <div className="p-8 print:p-4">
          <Link
            to="/admin/inquiries"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground print:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Inquiries
          </Link>

          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl font-bold animate-in fade-in slide-in-from-bottom-2 duration-300">
                {inquiry.reference ?? inquiry.id}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Created {formatDate(inquiry.created_at ?? '')}
              </p>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
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
                    ? (paymentId) => handleMarkPaymentReceived(paymentId)
                    : undefined
                }
                isLoading={paymentsLoading}
              />

              <ExportPanel
                inquiry={inquiry}
                onExportCsv={handleExportCsv}
                onPrint={handlePrint}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
