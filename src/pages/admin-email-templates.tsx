import { useState } from 'react'
import { Sidebar } from '@/components/layout/sidebar'
import { adminSidebarLinks } from '@/components/layout/sidebar-links'
import { useAuth } from '@/hooks/use-auth'
import { useEmailTemplates } from '@/hooks/use-email-templates'
import {
  AdminEmailTemplateList,
  AdminEmailTemplateEditor,
  AdminEmailTemplatePreview,
} from '@/components/admin-email'
import { toUserMessage } from '@/lib/errors'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
  const hasActiveFilters = statusFilter !== 'all' || localeFilter !== 'all'

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

          <div className="mt-8 flex flex-wrap gap-6">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Label htmlFor="status-filter" className="text-sm font-medium text-muted-foreground">
                Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter" className="w-full sm:w-[160px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <Label htmlFor="locale-filter" className="text-sm font-medium text-muted-foreground">
                Locale
              </Label>
              <Select value={localeFilter} onValueChange={setLocaleFilter}>
                <SelectTrigger id="locale-filter" className="w-full sm:w-[140px]">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="en">en</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6">
            <AdminEmailTemplateList
              templates={filtered}
              isLoading={isLoading}
              isError={isError}
              errorMessage={toUserMessage(error, 'Failed to load email templates')}
              onRetry={() => refetch()}
              hasActiveFilters={hasActiveFilters}
              onCreateClick={() => {
                setCreateMode(true)
                setSelectedId(null)
                setEditorOpen(true)
              }}
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
