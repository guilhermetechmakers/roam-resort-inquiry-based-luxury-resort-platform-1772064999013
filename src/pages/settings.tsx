import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  SettingsDashboardLayout,
  ProfileOverviewCard,
  NotificationPreferences,
  AccountSettings,
  SecuritySettings,
  PrivacyActionsPanel,
  PrivacyRequestsStatusTray,
} from '@/components/settings'
import { ProfileEditorPanel } from '@/components/profile'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/contexts/auth-context'
import { useChangePassword } from '@/hooks/use-profile'
import {
  useUserSettings,
  useUpdateSettings,
  useSessions,
  useLogoutOtherSessions,
  usePrivacyRequests,
  useInitiateDataExport,
  useInitiateAccountDeletion,
} from '@/hooks/use-settings'
import { mapAuthToProfile } from '@/api/profile'
import type { SettingsUserProfile } from '@/types/settings'
import type { UserProfile } from '@/types'
import type { AccountSettingsFormData } from '@/lib/validation/settings-validation'
import type { ChangePasswordFormData } from '@/lib/validation/profile-validation'

function settingsToUserProfile(s: SettingsUserProfile | null | undefined): UserProfile | null {
  if (!s) return null
  return {
    id: s.id,
    name: s.name,
    email: s.email,
    emailVerified: true,
    contactPrefs: s.preferences?.notifications
      ? { email: s.preferences.notifications.inquiryUpdates }
      : undefined,
    locale: s.language,
    avatarUrl: s.avatarUrl,
  }
}

export function SettingsPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [passwordOpen, setPasswordOpen] = useState(false)

  const { data: profile, isLoading: profileLoading } = useUserSettings(!!user?.id)
  const updateSettings = useUpdateSettings()
  const changePasswordMutation = useChangePassword()
  const { data: sessions = [], isLoading: sessionsLoading } = useSessions(!!user?.id)
  const logoutOthers = useLogoutOtherSessions()
  const { data: privacyRequests = [], isLoading: privacyLoading } = usePrivacyRequests(!!user?.id)
  const exportMutation = useInitiateDataExport()
  const deleteMutation = useInitiateAccountDeletion()

  const hasPendingDeletion = (privacyRequests ?? []).some(
    (r) => r.type === 'delete' && (r.status === 'Pending' || r.status === 'InProgress')
  )

  const handleSaveNotifications = useCallback(
    async (prefs: { inquiryUpdates: boolean; marketing: boolean; reminders: boolean }) => {
      try {
        await updateSettings.mutateAsync({
          preferences: { notifications: prefs },
        })
        toast.success('Notification preferences saved')
      } catch (err) {
        toast.error((err as Error).message)
      }
    },
    [updateSettings]
  )

  const handleSaveAccount = useCallback(
    async (data: AccountSettingsFormData) => {
      try {
        await updateSettings.mutateAsync({
          name: data.name,
          email: data.email,
          language: data.language,
          timezone: data.timezone,
        })
        toast.success('Account settings saved')
      } catch (err) {
        toast.error((err as Error).message)
      }
    },
    [updateSettings]
  )

  const handleChangePassword = useCallback(
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
        throw err
      }
    },
    [changePasswordMutation, user]
  )

  const handleLogoutOthers = useCallback(async () => {
    try {
      await logoutOthers.mutateAsync()
      toast.success('Other devices logged out')
    } catch (err) {
      toast.error((err as Error).message)
    }
  }, [logoutOthers])

  const handleRequestExport = useCallback(async () => {
    try {
      await exportMutation.mutateAsync()
      toast.success('Data export requested. You will receive an email when ready.')
    } catch (err) {
      toast.error((err as Error).message)
    }
  }, [exportMutation])

  const handleDeleteAccount = useCallback(async () => {
    try {
      await deleteMutation.mutateAsync()
      toast.success('Account deletion requested. Our team will contact you within 48 hours.')
    } catch (err) {
      toast.error((err as Error).message)
    }
  }, [deleteMutation])

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-48 animate-pulse rounded bg-muted" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h2 className="font-serif text-2xl font-semibold">Sign in to manage settings</h2>
        <Link to="/login" className="mt-4">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  return (
    <SettingsDashboardLayout>
      <ProfileOverviewCard
        profile={profile}
        isLoading={profileLoading}
        onEditProfile={() => setEditProfileOpen(true)}
        onChangePassword={() => setPasswordOpen(true)}
      />

      <NotificationPreferences
        profile={profile}
        onSave={handleSaveNotifications}
        isSaving={updateSettings.isPending}
      />

      <AccountSettings
        profile={profile}
        onSave={handleSaveAccount}
        isSaving={updateSettings.isPending}
      />

      <SecuritySettings
        sessions={sessions}
        isLoadingSessions={sessionsLoading}
        passwordOpen={passwordOpen}
        onPasswordOpenChange={setPasswordOpen}
        onChangePassword={handleChangePassword}
        onLogoutOthers={handleLogoutOthers}
      />

      <PrivacyActionsPanel
        onRequestExport={handleRequestExport}
        onDeleteAccount={handleDeleteAccount}
        isExporting={exportMutation.isPending}
        isDeleting={deleteMutation.isPending}
        hasPendingDeletion={hasPendingDeletion}
      />

      <PrivacyRequestsStatusTray
        requests={privacyRequests}
        isLoading={privacyLoading}
      />

      <div className="pt-4">
        <Link to="/profile">
          <Button variant="outline" className="border-accent/30 hover:border-accent">
            Back to Profile
          </Button>
        </Link>
      </div>

      <Dialog open={editProfileOpen} onOpenChange={setEditProfileOpen}>
        <DialogContent className="sm:max-w-md" showClose>
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
          </DialogHeader>
          {profile && (
            <ProfileEditorPanel
              profile={
                settingsToUserProfile(profile) ??
                mapAuthToProfile(
                  user?.id ?? '',
                  user?.email,
                  { full_name: user?.full_name, avatar_url: user?.avatar_url } as Record<string, unknown>,
                  false
                )!
              }
              onSuccess={() => setEditProfileOpen(false)}
              onCancel={() => setEditProfileOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </SettingsDashboardLayout>
  )
}
