import { useState, useCallback } from 'react'
import { Download, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { EXPORT_SCOPE_OPTIONS, type ExportScopeValue } from '@/types/privacy-compliance'
import { cn } from '@/lib/utils'

export interface DataExportRequestFormProps {
  onSubmit: (data: { scope: ExportScopeValue[] }) => Promise<void>
  isLoading?: boolean
  userEmail?: string
  className?: string
}

export function DataExportRequestForm({
  onSubmit,
  isLoading = false,
  userEmail = '',
  className,
}: DataExportRequestFormProps) {
  const [scope, setScope] = useState<ExportScopeValue[]>(['profile', 'inquiries'])
  const [consent, setConsent] = useState(false)
  const [error, setError] = useState<string>('')

  const toggleScope = useCallback((value: ExportScopeValue) => {
    setScope((prev) => {
      const next = prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
      return next.length > 0 ? next : prev
    })
  }, [])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()
      setError('')
      const scopeErr = scope.length === 0 ? 'Select at least one data category' : null
      const consentErr = !consent ? 'You must acknowledge the data export terms' : null
      if (scopeErr || consentErr) {
        setError(scopeErr ?? consentErr ?? '')
        return
      }
      try {
        await onSubmit({ scope })
      } catch (err) {
        setError((err as Error).message ?? 'Request failed')
      }
    },
    [scope, consent, onSubmit]
  )

  return (
    <Card className={cn('overflow-hidden transition-all duration-300 hover:shadow-card-hover', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-accent" />
          <h3 className="font-serif text-xl font-semibold">Request Data Export</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Under GDPR and CCPA, you can request a copy of your personal data. Select the data categories to include.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6" aria-label="Data export request form">
          {userEmail ? (
            <p className="text-sm text-muted-foreground">
              Export will be prepared for: <strong className="text-foreground">{userEmail}</strong>
            </p>
          ) : null}

          <div className="space-y-3">
            <Label className="font-medium">Data to include</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {(EXPORT_SCOPE_OPTIONS ?? []).map((opt) => (
                <label
                  key={opt.value}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-4 transition-colors',
                    'hover:border-accent/50 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2'
                  )}
                >
                  <Checkbox
                    checked={scope.includes(opt.value as ExportScopeValue)}
                    onCheckedChange={() => toggleScope(opt.value as ExportScopeValue)}
                    aria-label={opt.label}
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-3">
            <Checkbox
              id="consent"
              checked={consent}
              onCheckedChange={(v) => setConsent(v === true)}
              aria-describedby="consent-desc"
            />
            <div className="space-y-1">
              <Label htmlFor="consent" className="font-medium cursor-pointer">
                I acknowledge that:
              </Label>
              <p id="consent-desc" className="text-sm text-muted-foreground">
                I am requesting a copy of my personal data. The export will be prepared within 48 hours and a secure download link will be sent to my email. I understand this data is for my personal use only.
              </p>
            </div>
          </div>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            type="submit"
            disabled={isLoading || scope.length === 0 || !consent}
            className="gap-2 bg-accent hover:bg-accent/90"
          >
            <Download className="h-4 w-4" />
            {isLoading ? 'Submitting...' : 'Request data export'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
