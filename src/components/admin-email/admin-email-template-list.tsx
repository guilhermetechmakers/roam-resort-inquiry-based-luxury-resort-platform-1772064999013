import { Mail, Eye, AlertCircle, FilePlus2, Plus } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { RetryButton } from '@/components/ux'
import { cn } from '@/lib/utils'
import type { EmailTemplate } from '@/types/email'

function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    draft: 'bg-warning/20 text-warning',
    published: 'bg-success/20 text-success',
    archived: 'bg-muted text-muted-foreground',
  }
  return map[status] ?? 'bg-muted text-muted-foreground'
}

export interface AdminEmailTemplateListProps {
  templates: EmailTemplate[]
  isLoading?: boolean
  isError?: boolean
  errorMessage?: string
  onRetry?: () => void
  hasActiveFilters?: boolean
  onCreateClick?: () => void
  selectedId: string | null
  onSelect: (id: string) => void
  onPreview: (id: string) => void
}

export function AdminEmailTemplateList({
  templates,
  isLoading,
  isError,
  errorMessage,
  onRetry,
  hasActiveFilters,
  onCreateClick,
  selectedId,
  onSelect,
  onPreview,
}: AdminEmailTemplateListProps) {
  const list = Array.isArray(templates) ? templates : []

  if (isLoading) {
    return (
      <div className="space-y-2 animate-fade-in" role="status" aria-label="Loading templates">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <Card
        role="alert"
        aria-live="assertive"
        className="border-destructive/30 bg-destructive/5 animate-fade-in"
      >
        <CardContent className="flex flex-col items-center justify-center py-16">
          <AlertCircle className="h-12 w-12 text-destructive" aria-hidden />
          <p className="mt-4 font-medium text-destructive">
            {errorMessage ?? 'Failed to load email templates'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Please try again or contact support if the problem persists.
          </p>
          {onRetry && (
            <RetryButton onRetry={onRetry} label="Try again" className="mt-6" />
          )}
        </CardContent>
      </Card>
    )
  }

  if (list.length === 0) {
    return (
      <Card className="border-border animate-fade-in">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <FilePlus2 className="h-12 w-12 text-muted-foreground" aria-hidden />
          <p className="mt-4 font-medium text-foreground">
            {hasActiveFilters ? 'No templates match your filters' : 'No templates found'}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {hasActiveFilters
              ? 'Try adjusting your status or locale filters.'
              : 'Create your first template to get started.'}
          </p>
          {onCreateClick && !hasActiveFilters && (
            <Button
              onClick={onCreateClick}
              className="mt-6 bg-accent hover:bg-accent/90 text-accent-foreground"
              aria-label="Create new template"
            >
              <Plus className="mr-2 h-4 w-4" />
              New Template
            </Button>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {list.map((t) => (
        <Card
          key={t.id}
          className={cn(
            'cursor-pointer transition-all duration-200 hover:shadow-card-hover hover:border-accent/30',
            selectedId === t.id && 'border-accent/50 shadow-card'
          )}
          onClick={() => onSelect(t.id)}
        >
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-accent/10 p-2">
                <Mail className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="font-medium">{t.name}</p>
                <p className="text-sm text-muted-foreground">
                  {t.locale} · v{t.version} · {t.subject.slice(0, 50)}
                  {t.subject.length > 50 ? '…' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  'rounded-full px-2.5 py-0.5 text-xs font-medium',
                  getStatusClass(t.status)
                )}
              >
                {t.status}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onPreview(t.id)
                }}
                className="rounded-md p-2 hover:bg-muted transition-colors"
                aria-label="Preview"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
