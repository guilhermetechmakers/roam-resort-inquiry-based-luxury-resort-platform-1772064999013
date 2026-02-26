import { useState } from 'react'
import { Bell, Mail, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useMessages, useMarkMessageRead } from '@/hooks/use-profile'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export interface NotificationCenterProps {
  userId: string | undefined
  isLoading?: boolean
}

type FilterType = 'all' | 'unread' | 'unaddressed'

export function NotificationCenter({
  userId,
  isLoading,
}: NotificationCenterProps) {
  const { data: messages, isLoading: messagesLoading } = useMessages(userId)
  const markRead = useMarkMessageRead(userId)
  const [filter, setFilter] = useState<FilterType>('all')

  const safeMessages = Array.isArray(messages) ? messages : []

  const filteredMessages = (() => {
    if (filter === 'unread') {
      return safeMessages.filter((m) => !m.readAt)
    }
    if (filter === 'unaddressed') {
      return safeMessages.filter((m) => !m.readAt)
    }
    return safeMessages
  })()

  const unreadCount = safeMessages.filter((m) => !m.readAt).length

  const getChannelIcon = (channel: string) => {
    if (channel === 'email') return <Mail className="h-4 w-4" />
    return <MessageSquare className="h-4 w-4" />
  }

  if (isLoading || messagesLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <h3 className="font-serif text-xl font-semibold">
            Notifications
          </h3>
          <p className="text-sm text-muted-foreground">
            Concierge messages and status updates
          </p>
        </div>
        {unreadCount > 0 && (
          <span className="flex h-6 min-w-[24px] items-center justify-center rounded-full bg-accent/20 px-2 text-xs font-medium text-accent">
            {unreadCount}
          </span>
        )}
      </CardHeader>
      <CardContent>
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="unaddressed">Unaddressed</TabsTrigger>
          </TabsList>
          <div className="mt-4 space-y-3">
            {filteredMessages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">
                  No notifications yet
                </p>
                <p className="text-xs text-muted-foreground">
                  Concierge updates will appear here
                </p>
              </div>
            ) : (
              filteredMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    'flex gap-3 rounded-lg border border-border p-4 transition-colors',
                    !msg.readAt && 'border-accent/20 bg-accent/5'
                  )}
                >
                  <div className="shrink-0 mt-0.5">
                    {getChannelIcon(msg.channel)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">{msg.content}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(msg.createdAt)}
                    </p>
                  </div>
                  {!msg.readAt && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markRead.mutate(msg.id)}
                    >
                      Mark read
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </Tabs>
      </CardContent>
    </Card>
  )
}
