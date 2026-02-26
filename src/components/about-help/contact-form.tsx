import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { submitContact } from '@/api/support'
import { CONTACT_TOPICS } from '@/data/about-help-data'
import { cn } from '@/lib/utils'

const schema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
  topic: z.string().optional(),
  message: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be 2000 characters or less'),
})

type FormData = z.infer<typeof schema>

export interface ContactFormProps {
  onSubmit?: (data: FormData) => void | Promise<void>
  className?: string
}

export function ContactForm({ onSubmit, className }: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      topic: '',
      message: '',
    },
  })

  const handleSubmit = async (data: FormData) => {
    if (onSubmit) {
      await onSubmit(data)
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: data.name,
        email: data.email,
        topic: data.topic || undefined,
        message: data.message,
      }
      const result = await submitContact(payload)
      if (result?.ok) {
        setIsSuccess(true)
        form.reset()
        toast.success(result.message ?? 'Message sent. Our concierge team will respond within 24 hours.')
      } else {
        toast.error(result?.message ?? 'Something went wrong. Please try again.')
      }
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'Failed to send message'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSuccess && !form.formState.isDirty) {
    return (
      <Card className={cn('border-accent/30', className)}>
        <CardContent className="pt-6">
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-8 text-center">
            <p className="font-serif text-xl font-semibold text-foreground">
              Thank you for reaching out
            </p>
            <p className="mt-2 text-muted-foreground">
              Our concierge team will respond within 24 hours on business days.
            </p>
            <Button
              variant="outline"
              className="mt-6"
              onClick={() => setIsSuccess(false)}
            >
              Send another message
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const topicOptions = Array.isArray(CONTACT_TOPICS) ? CONTACT_TOPICS : []

  return (
    <section
      className={cn('py-16 sm:py-20', className)}
      aria-labelledby="contact-heading"
    >
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <h2
          id="contact-heading"
          className="font-serif text-3xl font-semibold text-foreground sm:text-4xl"
        >
          Contact Concierge
        </h2>
        <p className="mt-4 text-muted-foreground">
          Have a question or feedback? Our team is here to help.
        </p>
        <Card className="mt-10">
          <CardHeader>
            <h3 className="font-serif text-xl font-semibold">Send a message</h3>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={form.handleSubmit(handleSubmit)}
              className="space-y-6"
              noValidate
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="contact-name">Name</Label>
                  <Input
                    id="contact-name"
                    className="mt-2"
                    {...form.register('name')}
                    aria-invalid={!!form.formState.errors.name}
                    aria-describedby={form.formState.errors.name ? 'name-error' : undefined}
                  />
                  {form.formState.errors.name ? (
                    <p id="name-error" className="mt-1 text-sm text-destructive">
                      {form.formState.errors.name.message}
                    </p>
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="contact-email">Email</Label>
                  <Input
                    id="contact-email"
                    type="email"
                    className="mt-2"
                    {...form.register('email')}
                    aria-invalid={!!form.formState.errors.email}
                    aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
                  />
                  {form.formState.errors.email ? (
                    <p id="email-error" className="mt-1 text-sm text-destructive">
                      {form.formState.errors.email.message}
                    </p>
                  ) : null}
                </div>
              </div>
              <div>
                <Label htmlFor="contact-topic">Topic (optional)</Label>
                <Select
                  value={form.watch('topic') || undefined}
                  onValueChange={(v) => form.setValue('topic', v)}
                >
                  <SelectTrigger id="contact-topic" className="mt-2">
                    <SelectValue placeholder="Select a topic" />
                  </SelectTrigger>
                  <SelectContent>
                    {topicOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                  id="contact-message"
                  rows={5}
                  className="mt-2"
                  {...form.register('message')}
                  aria-invalid={!!form.formState.errors.message}
                  aria-describedby={form.formState.errors.message ? 'message-error' : undefined}
                />
                {form.formState.errors.message ? (
                  <p id="message-error" className="mt-1 text-sm text-destructive">
                    {form.formState.errors.message.message}
                  </p>
                ) : null}
                <p className="mt-1 text-xs text-muted-foreground">
                  {form.watch('message')?.length ?? 0} / 2000 characters
                </p>
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-accent hover:bg-accent/90 shadow-accent-glow"
              >
                {isSubmitting ? 'Sending…' : 'Send Message'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
