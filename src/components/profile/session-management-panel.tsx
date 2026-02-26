import { Monitor, Smartphone, LogOut } from 'lucide-react'
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
  const { data: sessions, isLoading: sessionsLoading } = useSessions(userId)
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
    if (!device) return <Monitor className="h-5 w-5" />
    const d = device.toLowerCase()
    if (d.includes('mobile') || d.includes('android') || d.includes('iphone')) {
      return <Smartphone className="h-5 w-5" />
    }
    return <Monitor className="h-5 w-5" />
  }

  if (isLoading || sessionsLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
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
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out all other devices
              </Button>
            </div>
          )}
          {safeSessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active sessions.
            </p>
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
                >
                  <LogOut className="mr-2 h-4 w-4" />
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => terminatingSession && handleTerminate(terminatingSession)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeAll}
              disabled={revokingAll}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {revokingAll ? 'Signing out...' : 'Sign out all'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
