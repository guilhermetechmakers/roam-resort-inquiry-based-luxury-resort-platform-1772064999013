import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CheckCircle } from 'lucide-react'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''
const FUNCTIONS_BASE = `${SUPABASE_URL}/functions/v1`

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
    try {
      const res = await fetch(`${FUNCTIONS_BASE}/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email: trimmed }),
      })
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
      if (!res.ok) throw new Error(data.error ?? 'Failed to unsubscribe')
      setSubmitted(true)
    } catch (err) {
      setError((err as Error).message ?? 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <Card className="w-full max-w-md border-border shadow-card">
        <CardHeader>
          <h1 className="font-serif text-2xl font-bold">Unsubscribe</h1>
          <p className="text-sm text-muted-foreground">
            Stop receiving transactional emails from Roam Resort.
          </p>
        </CardHeader>
        <CardContent>
          {submitted ? (
            <div className="flex flex-col items-center py-8">
              <CheckCircle className="h-12 w-12 text-green-600" />
              <p className="mt-4 font-medium">You have been unsubscribed.</p>
              <p className="mt-1 text-sm text-muted-foreground text-center">
                You will no longer receive transactional emails from Roam Resort.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="unsub-email">Email address</Label>
                <Input
                  id="unsub-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="mt-2"
                  required
                />
              </div>
              {error && (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-accent hover:bg-accent/90"
              >
                {loading ? 'Unsubscribing…' : 'Unsubscribe'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
