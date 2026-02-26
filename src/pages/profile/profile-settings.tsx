import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import {
  AccountSecurityActions,
  ProfileHeaderCard,
} from '@/components/profile'
import { useAuth } from '@/hooks/use-auth'
import { useProfile, useChangePassword } from '@/hooks/use-profile'

export function ProfileSettings() {
  const { user } = useAuth()
  const { data: profile, isLoading } = useProfile(user?.id)
  const [passwordOpen, setPasswordOpen] = useState(false)
  const changePasswordMutation = useChangePassword()

  const handleChangePassword = async (values: {
    currentPassword: string
    newPassword: string
    confirmPassword: string
  }) => {
    if (!user?.email) return
    await changePasswordMutation.mutateAsync({
      email: user.email,
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
      confirmPassword: values.confirmPassword,
    })
    toast.success('Password updated')
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <Link
          to="/profile"
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to overview
        </Link>
        <h1 className="font-serif text-3xl font-bold">Account settings</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your profile and security
        </p>

        <div className="mt-8 space-y-8">
          <ProfileHeaderCard
            profile={profile}
            isLoading={isLoading}
          />
          <AccountSecurityActions
            openPasswordDialog={passwordOpen}
            onOpenPasswordDialogChange={setPasswordOpen}
            onChangePassword={handleChangePassword}
            onRequestAccountDeletion={() => toast.info('Account deletion request received. Our team will contact you within 48 hours.')}
          />
        </div>
      </div>
    </div>
  )
}
