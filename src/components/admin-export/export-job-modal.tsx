/**
 * Confirmation modal for Retry or Cancel export actions.
 */

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

export interface ExportJobModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: 'retry' | 'cancel'
  exportId: string | null
  onConfirm: (exportId: string) => void
  isLoading?: boolean
}

export function ExportJobModal({
  open,
  onOpenChange,
  action,
  exportId,
  onConfirm,
  isLoading = false,
}: ExportJobModalProps) {
  const isRetry = action === 'retry'

  const handleConfirm = () => {
    if (exportId) {
      onConfirm(exportId)
      onOpenChange(false)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent aria-describedby="export-job-modal-description" aria-labelledby="export-job-modal-title">
        <AlertDialogHeader>
          <AlertDialogTitle id="export-job-modal-title">
            {isRetry ? 'Retry Export' : 'Cancel Export'}
          </AlertDialogTitle>
          <AlertDialogDescription id="export-job-modal-description">
            {isRetry
              ? 'This will retry the failed export. A new job will be created.'
              : 'This will cancel the export. The job will not complete.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading} aria-label="Keep export and close dialog">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
            disabled={!exportId || isLoading}
            aria-busy={isLoading}
            aria-label={isRetry ? 'Confirm retry export' : 'Confirm cancel export'}
            className={isRetry ? '' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}
          >
            {isLoading ? 'Please wait…' : isRetry ? 'Retry' : 'Cancel Export'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
