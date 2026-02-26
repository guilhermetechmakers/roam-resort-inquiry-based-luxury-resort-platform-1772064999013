import { Mail, Eye } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import type { EmailTemplate } from '@/types/email'

function getStatusClass(status: string): string {
  const map: Record<string, string> = {
    draft: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
    published: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    archived: 'bg-muted text-muted-foreground',
  }
  return map[status] ?? 'bg-muted text-muted-foreground'
}

export interface AdminEmailTemplateListProps {
  templates: EmailTemplate[]
  isLoading?: boolean
  selectedId: string | null
  onSelect: (id: string) => void
  onPreview: (id: string) => void
}

export function AdminEmailTemplateList({
  templates,
  isLoading,
  selectedId,
  onSelect,
  onPreview,
}: AdminEmailTemplateListProps) {
  const list = Array.isArray(templates) ? templates : []

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (list.length === 0) {
    return (
      <Card className="border-border">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <Mail className="h-12 w-12 text-muted-foreground" />
          <p className="mt-4 text-muted-foreground">No templates found</p>
          <p className="text-sm text-muted-foreground">Create your first template to get started</p>
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
