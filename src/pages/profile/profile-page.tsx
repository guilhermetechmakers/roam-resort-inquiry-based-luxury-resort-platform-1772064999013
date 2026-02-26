import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Sidebar } from '@/components/layout/sidebar'
import { profileSidebarLinks } from '@/components/layout/sidebar-links'
import { useAuth } from '@/hooks/use-auth'
import { useMyInquiries } from '@/hooks/use-inquiries'
import {
  useProfile,
  useChangePassword,
  useSessions,
  useMessages,
} from '@/hooks/use-profile'
import { mapAuthToProfile } from '@/api/profile'
import {
  ProfileHeaderCard,
  ProfileEditorPanel,
  InquiriesTimelinePanel,
  InquiryDetailModal,
  SessionManagementPanel,
  NotificationCenter,
  AccountSecurityActions,
  GuestInquiryHistoryPanel,
} from '@/components/profile'
import { Skeleton } from '@/components/ui/skeleton'
import { User, FileText, Receipt, Shield, Bell } from 'lucide-react'
import type { ChangePasswordFormData } from '@/lib/validation/profile-validation'
import type { Inquiry } from '@/types'

export function ProfilePage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [editorOpen, setEditorOpen] = useState(false)
  const [selectedInquiryId, setSelectedInquiryId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')

  const { data: profileData, isLoading: profileLoading } = useProfile(user?.id)
  const { data: inquiries = [], isLoading: inquiriesLoading } = useMyInquiries(user?.id)
  const { isLoading: sessionsLoading } = useSessions(user?.id)
  const { isLoading: messagesLoading } = useMessages(user?.id)
  const changePasswordMutation = useChangePassword()

  const profile =
    profileData ??
    (user
      ? mapAuthToProfile(
          user.id,
          user.email,
          {
            full_name: user.full_name,
            avatar_url: user.avatar_url,
          } as Record<string, unknown>,
          false
        )
      : null)

  const selectedInquiry = (inquiries ?? []).find((i) => i.id === selectedInquiryId) ?? null

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const handleEditProfile = useCallback(() => setEditorOpen(true), [])
  const handleChangePassword = useCallback(() => setPasswordDialogOpen(true), [])

  const handlePasswordSubmit = useCallback(
    async (values: ChangePasswordFormData) => {
      if (!user?.email) {
        toast.error('Email not found')
        return
      }
      try {
        await changePasswordMutation.mutateAsync({
          ...values,
          email: user.email,
        })
        toast.success('Password updated')
      } catch (err) {
        toast.error((err as Error).message)
      }
    },
    [changePasswordMutation, user]
  )

  const handleInquiryClick = useCallback((inquiry: Inquiry) => {
    setSelectedInquiryId(inquiry.id)
  }, [])

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Skeleton className="h-12 w-48" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h2 className="font-serif text-2xl font-semibold">Sign in to view your profile</h2>
        <Link to="/login" className="mt-4">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar links={profileSidebarLinks} title="My Profile" />
      <main className="flex-1 overflow-auto">
        <div className="p-6 lg:p-8">
          <div className="mb-8">
            <h1 className="font-serif text-3xl font-bold">Profile & My Inquiries</h1>
            <p className="mt-2 text-muted-foreground">
              Manage your profile, inquiries, and account settings
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full max-w-2xl grid-cols-2 gap-2 bg-muted/50 p-1 sm:grid-cols-5">
              <TabsTrigger value="overview" className="gap-2">
                <User className="h-4 w-4" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="inquiries" className="gap-2">
                <FileText className="h-4 w-4" />
                Inquiries
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2">
                <Receipt className="h-4 w-4" />
                History
              </TabsTrigger>
              <TabsTrigger value="sessions" className="gap-2">
                <Shield className="h-4 w-4" />
                Sessions
              </TabsTrigger>
              <TabsTrigger value="notifications" className="gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-8">
              <ProfileHeaderCard
                profile={profile}
                onEditProfile={handleEditProfile}
                onChangePassword={handleChangePassword}
                isLoading={profileLoading}
              />
              <InquiriesTimelinePanel
                inquiries={inquiries ?? []}
                isLoading={inquiriesLoading}
                onInquiryClick={handleInquiryClick}
                isStaff={user?.role === 'host' || user?.role === 'concierge'}
              />
              <AccountSecurityActions
                openPasswordDialog={passwordDialogOpen}
                onOpenPasswordDialogChange={setPasswordDialogOpen}
                onChangePassword={handlePasswordSubmit}
                onRequestAccountDeletion={() => toast.info('Account deletion request sent')}
              />
            </TabsContent>

            <TabsContent value="inquiries" className="space-y-6">
              <InquiriesTimelinePanel
                inquiries={inquiries ?? []}
                isLoading={inquiriesLoading}
                onInquiryClick={handleInquiryClick}
                isStaff={user?.role === 'host' || user?.role === 'concierge'}
              />
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              <GuestInquiryHistoryPanel
                userId={user?.id}
                onInquiryClick={handleInquiryClick}
              />
            </TabsContent>

            <TabsContent value="sessions" className="space-y-6">
              <SessionManagementPanel
                userId={user?.id}
                isLoading={sessionsLoading}
              />
              <AccountSecurityActions
                openPasswordDialog={passwordDialogOpen}
                onOpenPasswordDialogChange={setPasswordDialogOpen}
                onChangePassword={handlePasswordSubmit}
                onRequestAccountDeletion={() => toast.info('Account deletion request sent')}
              />
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <NotificationCenter
                userId={user?.id}
                isLoading={messagesLoading}
              />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="sm:max-w-md" showClose>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogHeader>
          {profile && (
            <ProfileEditorPanel
              profile={profile}
              onSuccess={() => setEditorOpen(false)}
              onCancel={() => setEditorOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      <InquiryDetailModal
        open={!!selectedInquiryId}
        onOpenChange={(open) => !open && setSelectedInquiryId(null)}
        inquiry={selectedInquiry}
      />
    </div>
  )
}
