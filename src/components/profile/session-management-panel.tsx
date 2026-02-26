import { Monitor, Smartphone, LogOut, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { useSessions, useTerminateSession } from '@/hooks/use-profile'
import { formatDate } from '@/lib/utils'
import type { Session } from '@/types'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { revokeAllSessions } from '@/api/sessions'
import { toast } from 'sonner'

export interface SessionManagementPanelProps {
  userId: string | undefined
  isLoading?: boolean
}

export function SessionManagementPanel({
  userId,
  isLoading,
}: SessionManagementPanelProps) {
  const navigate = useNavigate()
  const {
    data: sessions,
    isLoading: sessionsLoading,
    isError: sessionsError,
    refetch: refetchSessions,
  } = useSessions(userId)
  const terminateSession = useTerminateSession(userId)
  const [terminatingSession, setTerminatingSession] = useState<Session | null>(null)
  const [revokeAllConfirm, setRevokeAllConfirm] = useState(false)
  const [revokingAll, setRevokingAll] = useState(false)

  const safeSessions = Array.isArray(sessions) ? sessions : []

  const handleTerminate = async (session: Session) => {
    try {
      const sessionId = session.isCurrent ? 'current' : session.id
      await terminateSession.mutateAsync({ sessionId })
      setTerminatingSession(null)
      if (session.isCurrent) {
        navigate('/')
      }
      toast.success('Session terminated')
    } catch {
      toast.error('Failed to terminate session')
    }
  }

  const handleRevokeAll = async () => {
    setRevokingAll(true)
    try {
      await revokeAllSessions()
      setRevokeAllConfirm(false)
      navigate('/')
      toast.success('All sessions signed out')
    } catch {
      toast.error('Failed to revoke all sessions')
    } finally {
      setRevokingAll(false)
    }
  }

  const getDeviceIcon = (device?: string) => {
    if (!device) return <Monitor className="h-5 w-5" aria-hidden />
    const d = device.toLowerCase()
    if (d.includes('mobile') || d.includes('android') || d.includes('iphone')) {
      return <Smartphone className="h-5 w-5" aria-hidden />
    }
    return <Monitor className="h-5 w-5" aria-hidden />
  }

  if (isLoading || sessionsLoading) {
    return (
      <Card role="status" aria-label="Loading sessions">
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
          <Skeleton className="h-20 w-full rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  if (sessionsError) {
    return (
      <Card className="border-destructive/30">
        <CardHeader>
          <h3 className="font-serif text-xl font-semibold text-foreground">
            Active sessions
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage your active sessions and sign out from other devices.
          </p>
        </CardHeader>
        <CardContent>
          <div
            className="flex flex-col items-center justify-center gap-4 rounded-lg border border-border bg-muted/30 p-8 text-center"
            role="alert"
            aria-live="polite"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" aria-hidden />
            </div>
            <div>
              <p className="font-medium text-foreground">
                Unable to load sessions
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                There was a problem loading your active sessions. Please try again.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void refetchSessions()}
              aria-label="Retry loading sessions"
            >
              Try again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <h3 className="font-serif text-xl font-semibold">
            Active sessions
          </h3>
          <p className="text-sm text-muted-foreground">
            Manage your active sessions and sign out from other devices.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {safeSessions.length > 1 && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRevokeAllConfirm(true)}
                disabled={terminateSession.isPending || revokingAll}
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                aria-label="Sign out from all other devices"
              >
                <LogOut className="mr-2 h-4 w-4" aria-hidden />
                Sign out all other devices
              </Button>
            </div>
          )}
          {safeSessions.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed border-border bg-muted/20 p-8 text-center"
              role="status"
              aria-label="No active sessions"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Monitor className="h-6 w-6 text-muted-foreground" aria-hidden />
              </div>
              <div>
                <p className="font-medium text-foreground">
                  No active sessions
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You have no active sessions. When you sign in on a device, it will appear here.
                </p>
              </div>
            </div>
          ) : (
            safeSessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  'flex items-center justify-between gap-4 rounded-lg border border-border p-4',
                  session.isCurrent && 'border-accent/30 bg-accent/5'
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    {getDeviceIcon(session.device)}
                  </div>
                  <div>
                    <p className="font-medium">
                      {session.device ?? 'Unknown device'}
                      {session.isCurrent && (
                        <span className="ml-2 text-xs text-accent">
                          (current)
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Last active: {formatDate(session.lastActive)}
                    </p>
                    {session.location && (
                      <p className="text-xs text-muted-foreground">
                        {session.location}
                      </p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setTerminatingSession(session)}
                  disabled={terminateSession.isPending}
                  className={
                    session.isCurrent
                      ? ''
                      : 'text-destructive hover:bg-destructive/10 hover:text-destructive'
                  }
                  aria-label={
                    session.isCurrent
                      ? `Sign out from current device (${session.device ?? 'Unknown device'})`
                      : `Terminate session on ${session.device ?? 'Unknown device'}`
                  }
                >
                  <LogOut className="mr-2 h-4 w-4" aria-hidden />
                  {session.isCurrent ? 'Sign out' : 'Terminate'}
                </Button>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <AlertDialog
        open={!!terminatingSession}
        onOpenChange={(open) => !open && setTerminatingSession(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Terminate session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign out the selected device. You may need to sign in
              again on that device.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel aria-label="Cancel and keep session active">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => terminatingSession && handleTerminate(terminatingSession)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              aria-label="Confirm terminate session"
            >
              Terminate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={revokeAllConfirm}
        onOpenChange={(open) => !open && setRevokeAllConfirm(false)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign out all devices?</AlertDialogTitle>
            <AlertDialogDescription>
              This will sign you out from all devices including this one. You will need to sign in again.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel aria-label="Cancel and keep other sessions active">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAll}
              disabled={revokingAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              aria-label={revokingAll ? 'Signing out from all devices' : 'Confirm sign out from all devices'}
            >
              {revokingAll ? 'Signing out...' : 'Sign out all'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
