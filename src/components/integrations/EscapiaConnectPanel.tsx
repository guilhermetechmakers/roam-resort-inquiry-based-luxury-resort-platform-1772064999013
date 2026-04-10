/**
 * EscapiaConnectPanel
 *
 * Displays in the host dashboard above the listings grid.
 * Four states:
 *   1. not-connected — credential form
 *   2. syncing       — progress indicator (auto-polls every 3 s)
 *   3. connected     — status + Sync Now + Disconnect
 *   4. error         — error message + Retry
 */

import { useState } from 'react'
import { RefreshCw, Link2, Link2Off, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import {
  useEscapiaSyncStatus,
  useSaveEscapiaCredentials,
  useTriggerEscapiaSync,
  useRemoveEscapiaCredentials,
} from '@/hooks/use-escapia-integration'

function formatDate(iso: string | null | undefined): string {
  if (!iso) return 'Never'
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function EscapiaConnectPanel({ className }: { className?: string }) {
  const { data: syncStatus, isLoading: statusLoading } = useEscapiaSyncStatus()
  const saveCredentials = useSaveEscapiaCredentials()
  const triggerSync = useTriggerEscapiaSync()
  const removeCredentials = useRemoveEscapiaCredentials()

  const [clientId, setClientId] = useState('')
  const [clientSecret, setClientSecret] = useState('')
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false)

  const isSyncing =
    syncStatus?.last_sync_status === 'syncing' ||
    saveCredentials.isPending ||
    triggerSync.isPending

  const isConnected = !!syncStatus && !saveCredentials.isPending
  const hasError = syncStatus?.last_sync_status === 'error'

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault()
    const id = clientId.trim()
    const secret = clientSecret.trim()
    if (!id || !secret) {
      toast.error('Both Client ID and Client Secret are required.')
      return
    }
    try {
      const result = await saveCredentials.mutateAsync({ clientId: id, clientSecret: secret })
      toast.success(`Escapia connected — ${result.synced} listing${result.synced !== 1 ? 's' : ''} imported.`)
      setClientId('')
      setClientSecret('')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to connect'
      toast.error(msg)
    }
  }

  async function handleSync() {
    try {
      const result = await triggerSync.mutateAsync()
      toast.success(`Sync complete — ${result.synced} listing${result.synced !== 1 ? 's' : ''} updated.`)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Sync failed'
      toast.error(msg)
    }
  }

  async function handleDisconnect() {
    try {
      await removeCredentials.mutateAsync()
      toast.success('Escapia account disconnected.')
      setShowDisconnectConfirm(false)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to disconnect'
      toast.error(msg)
    }
  }

  if (statusLoading) {
    return (
      <div className={cn('h-20 rounded-xl border border-border bg-card animate-pulse', className)} />
    )
  }

  // ── Not connected ────────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <Card className={cn('border-border shadow-card', className)}>
        <CardHeader className="border-b border-border bg-secondary/20 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10">
              <Link2 className="h-5 w-5 text-accent" />
            </div>
            <div>
              <h3 className="font-serif text-base font-semibold">Import from Escapia</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Connect your Escapia account to sync all property listings automatically.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-6 py-5">
          <form onSubmit={handleConnect} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 min-w-0">
              <Label htmlFor="escapia-client-id" className="text-xs font-medium">
                Client ID
              </Label>
              <Input
                id="escapia-client-id"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="Your Escapia Client ID"
                autoComplete="off"
                className="mt-1.5 h-10 text-sm"
                disabled={saveCredentials.isPending}
                required
              />
            </div>
            <div className="flex-1 min-w-0">
              <Label htmlFor="escapia-client-secret" className="text-xs font-medium">
                Client Secret
              </Label>
              <Input
                id="escapia-client-secret"
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Your Escapia Client Secret"
                autoComplete="new-password"
                className="mt-1.5 h-10 text-sm"
                disabled={saveCredentials.isPending}
                required
              />
            </div>
            <Button
              type="submit"
              disabled={saveCredentials.isPending}
              className="h-10 shrink-0 bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {saveCredentials.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connecting…
                </>
              ) : (
                <>
                  <Link2 className="mr-2 h-4 w-4" />
                  Connect & Import
                </>
              )}
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">
            Credentials are stored securely and never exposed in the browser.
            Imported listings appear as <strong>drafts</strong> for your review.
          </p>
        </CardContent>
      </Card>
    )
  }

  // ── Connected (syncing / success / error) ────────────────────────────────────
  return (
    <Card className={cn('border-border shadow-card', className)}>
      <CardContent className="flex flex-wrap items-center gap-4 px-6 py-4">
        {/* Status indicator */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          {isSyncing ? (
            <Loader2 className="h-5 w-5 animate-spin text-accent shrink-0" />
          ) : hasError ? (
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
          )}

          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight">
              {isSyncing
                ? 'Syncing from Escapia…'
                : hasError
                ? 'Last sync failed'
                : `Escapia connected · ${syncStatus?.last_sync_count ?? 0} listing${(syncStatus?.last_sync_count ?? 0) !== 1 ? 's' : ''} imported`}
            </p>
            {!isSyncing && (
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {hasError && syncStatus?.last_sync_error
                  ? syncStatus.last_sync_error
                  : `Last synced: ${formatDate(syncStatus?.last_synced_at)}`}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSync}
            disabled={isSyncing || triggerSync.isPending}
            className="h-8 text-xs"
            aria-label="Sync now from Escapia"
          >
            <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', isSyncing && 'animate-spin')} />
            {hasError ? 'Retry Sync' : 'Sync Now'}
          </Button>

          {showDisconnectConfirm ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Disconnect?</span>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDisconnect}
                disabled={removeCredentials.isPending}
                className="h-8 text-xs"
              >
                {removeCredentials.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  'Yes, disconnect'
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDisconnectConfirm(false)}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDisconnectConfirm(true)}
              className="h-8 text-xs text-muted-foreground hover:text-destructive"
              aria-label="Disconnect Escapia account"
            >
              <Link2Off className="mr-1.5 h-3.5 w-3.5" />
              Disconnect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
