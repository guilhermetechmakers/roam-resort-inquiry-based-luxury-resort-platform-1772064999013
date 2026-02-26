import { Eye, Save, Upload, XCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

export interface PublishControlsProps {
  isPublished: boolean
  onSaveDraft: () => void
  onPreview: () => void
  onPublish: () => void
  onUnpublish: () => void
  isSubmitting?: boolean
  validationErrors?: string[]
  canPublish?: boolean
  className?: string
}

export function PublishControls({
  isPublished,
  onSaveDraft,
  onPreview,
  onPublish,
  onUnpublish,
  isSubmitting,
  validationErrors = [],
  canPublish = true,
  className,
}: PublishControlsProps) {
  const hasErrors = Array.isArray(validationErrors) && validationErrors.length > 0

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-4 p-6 rounded-xl border border-border bg-card shadow-card',
        className
      )}
    >
      <Button
        type="button"
        variant="outline"
        onClick={onSaveDraft}
        disabled={isSubmitting}
        className="border-accent/50 text-accent hover:bg-accent/10"
      >
        <Save className="h-4 w-4 mr-2" />
        Save Draft
      </Button>

      <Button
        type="button"
        variant="outline"
        onClick={onPreview}
        disabled={isSubmitting}
      >
        <Eye className="h-4 w-4 mr-2" />
        Preview
      </Button>

      {isPublished ? (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Unpublish
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Unpublish listing?</AlertDialogTitle>
              <AlertDialogDescription>
                Your listing will be hidden from the public and removed from destination pages.
                You can publish it again at any time.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onUnpublish}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Unpublish
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              type="button"
              disabled={isSubmitting || !canPublish}
              className="bg-accent text-accent-foreground hover:bg-accent/90 shadow-md hover:shadow-lg transition-all hover:scale-[1.02]"
            >
              <Upload className="h-4 w-4 mr-2" />
              Publish
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Publish listing?</AlertDialogTitle>
              <AlertDialogDescription>
                {hasErrors ? (
                  <>
                    Please fix the validation errors before publishing:
                    <ul className="mt-2 list-disc list-inside text-sm">
                      {validationErrors.slice(0, 5).map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                      {validationErrors.length > 5 && (
                        <li>...and {validationErrors.length - 5} more</li>
                      )}
                    </ul>
                  </>
                ) : (
                  'Your listing will be visible on destination pages and guests can submit inquiries.'
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              {!hasErrors && (
                <AlertDialogAction onClick={onPublish}>
                  Publish
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  )
}
