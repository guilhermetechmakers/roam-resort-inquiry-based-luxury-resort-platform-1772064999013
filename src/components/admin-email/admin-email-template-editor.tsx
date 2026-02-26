import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useEmailTemplate, useCreateEmailTemplate, useUpdateEmailTemplate, usePublishEmailTemplate } from '@/hooks/use-email-templates'
const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  slug: z.string().max(100).optional(),
  locale: z.string().min(1).max(10),
  subject: z.string().min(1, 'Subject is required').max(200),
  html_body: z.string(),
  text_body: z.string(),
})

type FormData = z.infer<typeof schema>

export interface AdminEmailTemplateEditorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  templateId: string | null
  createMode: boolean
  onSuccess?: () => void
}

export function AdminEmailTemplateEditor({
  open,
  onOpenChange,
  templateId,
  createMode,
  onSuccess,
}: AdminEmailTemplateEditorProps) {
  const { data: template, isLoading } = useEmailTemplate(templateId)
  const createMutation = useCreateEmailTemplate()
  const updateMutation = useUpdateEmailTemplate()
  const publishMutation = usePublishEmailTemplate()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      slug: '',
      locale: 'en',
      subject: '',
      html_body: '',
      text_body: '',
    },
  })

  useEffect(() => {
    if (template) {
      form.reset({
        name: template.name,
        slug: template.slug ?? template.name.replace(/\s+/g, '_').toLowerCase(),
        locale: template.locale,
        subject: template.subject,
        html_body: template.html_body,
        text_body: template.text_body ?? '',
      })
    } else if (createMode) {
      form.reset({
        name: '',
        slug: '',
        locale: 'en',
        subject: '',
        html_body: '',
        text_body: '',
      })
    }
  }, [template, createMode, form])

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      if (createMode) {
        await createMutation.mutateAsync({
          name: data.name,
          slug: data.slug?.trim() ? data.slug.trim().toLowerCase().replace(/\s+/g, '_') : undefined,
          locale: data.locale,
          subject: data.subject,
          html_body: data.html_body,
          text_body: data.text_body || undefined,
        })
        toast.success('Template created')
      } else if (templateId) {
        await updateMutation.mutateAsync({
          id: templateId,
          payload: {
            subject: data.subject,
            html_body: data.html_body,
            text_body: data.text_body,
          },
        })
        toast.success('Template updated')
      }
      onSuccess?.()
      onOpenChange(false)
    } catch (err) {
      toast.error((err as Error)?.message ?? 'Failed to save')
    }
  })

  const handlePublish = async () => {
    if (!templateId) return
    try {
      await publishMutation.mutateAsync(templateId)
      toast.success('Template published')
      onSuccess?.()
    } catch (err) {
      toast.error((err as Error)?.message ?? 'Failed to publish')
    }
  }

  const isSubmitting =
    createMutation.isPending || updateMutation.isPending || publishMutation.isPending

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {createMode ? 'Create Template' : 'Edit Template'}
          </DialogTitle>
        </DialogHeader>
        {!createMode && isLoading ? (
          <div className="py-8 text-center text-muted-foreground">Loading…</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="e.g. inquiry_confirmation"
                  disabled={!createMode}
                  className="focus:ring-accent/30"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  {...form.register('slug')}
                  placeholder="e.g. inquiry_confirmation"
                  disabled={!createMode}
                  className="focus:ring-accent/30"
                />
                {form.formState.errors.slug && (
                  <p className="text-sm text-destructive">{form.formState.errors.slug.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="locale">Locale</Label>
                <Input
                  id="locale"
                  {...form.register('locale')}
                  placeholder="en"
                  disabled={!createMode}
                  className="focus:ring-accent/30"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                {...form.register('subject')}
                placeholder="Use {{variable}} for substitutions"
                className="focus:ring-accent/30"
              />
              {form.formState.errors.subject && (
                <p className="text-sm text-destructive">{form.formState.errors.subject.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="html_body">HTML Body</Label>
              <Textarea
                id="html_body"
                {...form.register('html_body')}
                rows={10}
                className="font-mono text-sm focus:ring-accent/30"
                placeholder="<html>... Use {{guestName}}, {{reference}}, etc.</html>"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="text_body">Plain Text Body (fallback)</Label>
              <Textarea
                id="text_body"
                {...form.register('text_body')}
                rows={4}
                className="font-mono text-sm focus:ring-accent/30"
              />
            </div>

            <div className="flex justify-end gap-2">
              {!createMode && templateId && template?.status === 'draft' && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handlePublish}
                  disabled={isSubmitting}
                  className="hover:border-accent/30"
                >
                  Publish
                </Button>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-accent hover:bg-accent/90"
              >
                {createMode ? 'Create' : 'Save'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
