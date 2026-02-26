import { useState } from 'react'
import { Sidebar, adminSidebarLinks } from '@/components/layout/sidebar'
import { useAuth } from '@/contexts/auth-context'
import { useEmailTemplates } from '@/hooks/use-email-templates'
import {
  AdminEmailTemplateList,
  AdminEmailTemplateEditor,
  AdminEmailTemplatePreview,
} from '@/components/admin-email'
import { ErrorBanner } from '@/components/auth'
import { toUserMessage } from '@/lib/errors'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AdminEmailTemplatesPage() {
  const { hasRole, isLoading: authLoading } = useAuth()
  const { data: templates, isLoading, isError, error, refetch } = useEmailTemplates()
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [localeFilter, setLocaleFilter] = useState<string>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [createMode, setCreateMode] = useState(false)
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null)

  const list = Array.isArray(templates) ? templates : []
  const filtered = list.filter((t) => {
    const matchStatus = statusFilter === 'all' || t.status === statusFilter
    const matchLocale = localeFilter === 'all' || t.locale === localeFilter
    return matchStatus && matchLocale
  })

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
      <main className="flex-1 overflow-auto">
        <div className="p-8">
          {isError && (
            <ErrorBanner
              message={toUserMessage(error, 'Failed to load email templates')}
              onRetry={() => refetch()}
              className="mb-6"
            />
          )}

          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold">Email Templates</h1>
              <p className="mt-2 text-muted-foreground">
                Create, edit, and preview transactional email templates with substitution variables.
              </p>
            </div>
            <Button
              onClick={() => {
                setCreateMode(true)
                setSelectedId(null)
                setEditorOpen(true)
              }}
              className="bg-accent hover:bg-accent/90 text-accent-foreground hover:scale-[1.02] active:scale-[0.98] transition-all"
            >
              <Plus className="mr-2 h-5 w-5" />
              New Template
            </Button>
          </div>

          <div className="mt-8 flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Status</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-accent/30"
              >
                <option value="all">All</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-muted-foreground">Locale</span>
              <select
                value={localeFilter}
                onChange={(e) => setLocaleFilter(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-accent/30"
              >
                <option value="all">All</option>
                <option value="en">en</option>
              </select>
            </div>
          </div>

          <div className="mt-6">
            <AdminEmailTemplateList
              templates={filtered}
              isLoading={isLoading}
              selectedId={selectedId}
              onSelect={(id) => {
                setSelectedId(id)
                setCreateMode(false)
                setEditorOpen(true)
              }}
              onPreview={(id) => setPreviewTemplateId(id)}
            />
          </div>
        </div>
      </main>

      <AdminEmailTemplateEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        templateId={createMode ? null : selectedId}
        createMode={createMode}
        onSuccess={() => {
          setEditorOpen(false)
          setSelectedId(null)
          setCreateMode(false)
          refetch()
        }}
      />

      <AdminEmailTemplatePreview
        open={!!previewTemplateId}
        onOpenChange={(open) => !open && setPreviewTemplateId(null)}
        templateId={previewTemplateId}
      />
    </div>
  )
}
