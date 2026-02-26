import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle, Loader2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`

function getErrorMessage(err: unknown, res?: Response, data?: { error?: string }): string {
  if (typeof (err as Error)?.message === 'string' && (err as Error).message.trim()) {
    const msg = (err as Error).message.trim()
    if (msg.toLowerCase().includes('fetch') || msg.toLowerCase().includes('network')) {
      return 'Network error. Please check your connection and try again.'
    }
    return msg
  }
  if (typeof data?.error === 'string' && data.error.trim()) {
    return data.error.trim()
  }
  if (res?.status === 404) {
    return 'Unsubscribe service is temporarily unavailable. Please try again later.'
  }
  if (res?.status === 429) {
    return 'Too many requests. Please wait a moment before trying again.'
  }
  if (res?.status && res.status >= 500) {
    return 'Our servers are experiencing issues. Please try again in a few minutes.'
  }
  return 'Something went wrong. Please try again.'
}

export function UnsubscribePage() {
  const [searchParams] = useSearchParams()
  const emailParam = searchParams.get('email') ?? ''
  const [email, setEmail] = useState(emailParam)
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const trimmed = email.trim().toLowerCase()
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Please enter a valid email address.')
      return
    }
    setLoading(true)
    let res: Response | undefined
    let data: { ok?: boolean; error?: string } = {}
    try {
      res = await fetch(`${FUNCTIONS_BASE}/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email: trimmed }),
      })
      data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to unsubscribe')
      setSubmitted(true)
    } catch (err) {
      setError(getErrorMessage(err, res, data))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-8 sm:py-12">
      <Card className="w-full max-w-md border-border shadow-card rounded-lg transition-shadow duration-200 hover:shadow-card-hover">
        <CardHeader className="space-y-1">
          <h1 className="font-serif text-2xl font-bold text-foreground sm:text-3xl">
            Unsubscribe
          </h1>
          <p className="text-sm text-muted-foreground">
            Stop receiving transactional emails from Roam Resort.
          </p>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div
              className="flex flex-col items-center py-8 animate-fade-in"
              role="status"
              aria-live="polite"
              aria-label="Unsubscribe successful"
            >
              <CheckCircle
                className="h-12 w-12 text-success animate-checkmark-pop"
                aria-hidden
              />
              <p className="mt-4 font-medium text-foreground">You have been unsubscribed.</p>
              <p className="mt-1 text-sm text-muted-foreground text-center">
                You will no longer receive transactional emails from Roam Resort.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              aria-labelledby="unsubscribe-heading"
              aria-describedby="unsubscribe-description"
            >
              <div id="unsubscribe-heading" className="sr-only">
                Unsubscribe from Roam Resort emails
              </div>
              <p id="unsubscribe-description" className="sr-only">
                Enter your email address to stop receiving transactional emails.
              </p>
              <div>
                <Label htmlFor="unsub-email">Email address</Label>
                <Input
                  id="unsub-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-2 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  required
                  disabled={loading}
                  aria-label="Email address for unsubscribe"
                  aria-invalid={!!error}
                  aria-describedby={error ? 'unsub-error' : undefined}
                />
              </div>
              {error && (
                <div
                  id="unsub-error"
                  role="alert"
                  aria-live="polite"
                  className={cn(
                    'flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive',
                    'animate-fade-in'
                  )}
                >
                  <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}
              <Button
                type="submit"
                disabled={loading}
                aria-busy={loading}
                aria-label={loading ? 'Unsubscribing, please wait' : 'Unsubscribe from emails'}
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-[1.02] transition-all duration-200 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
              >
                {loading ? (
                  <>
                    <Loader2
                      className="mr-2 h-4 w-4 animate-spin"
                      aria-hidden
                    />
                    Unsubscribing…
                  </>
                ) : (
                  'Unsubscribe'
                )}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
