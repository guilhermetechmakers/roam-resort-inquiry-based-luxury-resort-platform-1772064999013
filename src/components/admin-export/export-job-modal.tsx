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
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isRetry ? 'Retry Export' : 'Cancel Export'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isRetry
              ? 'This will retry the failed export. A new job will be created.'
              : 'This will cancel the export. The job will not complete.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleConfirm()
            }}
            disabled={!exportId || isLoading}
            className={isRetry ? '' : 'bg-destructive text-destructive-foreground hover:bg-destructive/90'}
          >
            {isLoading ? 'Please wait…' : isRetry ? 'Retry' : 'Cancel Export'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
