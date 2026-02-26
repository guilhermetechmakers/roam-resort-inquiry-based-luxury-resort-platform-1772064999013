import { useState } from 'react'
import { Download, Trash2, FileText } from 'lucide-react'
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
import { GuidanceInline } from './help-tooltip'

export interface PrivacyActionsPanelProps {
  onRequestExport: () => Promise<void>
  onDeleteAccount: () => Promise<void>
  isExporting?: boolean
  isDeleting?: boolean
  hasPendingDeletion?: boolean
}

export function PrivacyActionsPanel({
  onRequestExport,
  onDeleteAccount,
  isExporting = false,
  isDeleting = false,
  hasPendingDeletion = false,
}: PrivacyActionsPanelProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [exportConfirmOpen, setExportConfirmOpen] = useState(false)

  const handleDeleteClick = () => setDeleteConfirmOpen(true)
  const handleExportClick = () => setExportConfirmOpen(true)

  const handleDeleteConfirm = async () => {
    await onDeleteAccount()
    setDeleteConfirmOpen(false)
  }

  const handleExportConfirm = async () => {
    await onRequestExport()
    setExportConfirmOpen(false)
  }

  return (
    <>
      <Card className="overflow-hidden transition-all duration-300 hover:shadow-card-hover">
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-accent" />
            <h3 className="font-serif text-xl font-semibold">Privacy & Data</h3>
          </div>
          <p className="text-sm text-muted-foreground">
            GDPR/CCPA: Export your data or delete your account
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <GuidanceInline
            title="Your privacy rights"
            defaultCollapsed
          >
            <p className="mb-2">
              Under GDPR and CCPA, you have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Request a copy of your personal data (data export)</li>
              <li>Request deletion of your account and associated data</li>
              <li>Access and correct your personal information</li>
            </ul>
          </GuidanceInline>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              className="gap-2 border-accent/30 hover:border-accent hover:bg-accent/10"
              onClick={handleExportClick}
              disabled={isExporting || hasPendingDeletion}
            >
              <Download className="h-4 w-4" />
              {isExporting ? 'Requesting...' : 'Request data export'}
            </Button>
            <Button
              variant="ghost"
              className="gap-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              onClick={handleDeleteClick}
              disabled={isDeleting || hasPendingDeletion}
            >
              <Trash2 className="h-4 w-4" />
              {isDeleting ? 'Processing...' : 'Delete account'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={exportConfirmOpen} onOpenChange={setExportConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Request data export?</AlertDialogTitle>
            <AlertDialogDescription>
              We will prepare a copy of your personal data. You will receive an email when it is ready to download. This may take up to 48 hours.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleExportConfirm()}>
              Request export
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all associated data. This action cannot be undone. Our team may contact you within 48 hours to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteConfirm()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
