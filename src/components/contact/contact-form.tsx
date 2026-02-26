import { useState, useEffect } from 'react'
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
import { DestinationSelector } from './destination-selector'
import { ContactFormSuccess } from './contact-form-success'
import { submitContactInquiry } from '@/api/contact-inquiries'
import {
  CONTACT_SUBJECTS,
  PREFERRED_CONTACT_OPTIONS,
  MESSAGE_MIN,
  MESSAGE_MAX,
} from '@/lib/validation/contact-validation'
import { cn } from '@/lib/utils'
import type { User } from '@/types'
import type { PreferredContactMethod } from '@/types/contact-inquiry'

const SUBJECT_TO_CATEGORY: Record<string, 'general' | 'concierge' | 'billing' | 'technical'> = {
  'General Question': 'general',
  'Concierge Request': 'concierge',
  'Payment Inquiry': 'billing',
  'Technical Support': 'technical',
  'Booking & Availability': 'general',
  'Cancellation or Changes': 'general',
  'Feedback': 'general',
  'Other': 'general',
}

const contactFormSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name is required')
      .max(100, 'Name must be 100 characters or less'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
    subject: z.string().min(1, 'Subject is required'),
    message: z
      .string()
      .min(MESSAGE_MIN, `Message must be at least ${MESSAGE_MIN} characters`)
      .max(MESSAGE_MAX, `Message must be ${MESSAGE_MAX} characters or less`),
    destinationId: z.string().nullable().optional(),
    startDate: z.string().nullable().optional(),
    endDate: z.string().nullable().optional(),
    guests: z.coerce.number().min(0).max(20).nullable().optional(),
    inquiryReference: z.string().max(50).nullable().optional(),
    preferredContactMethod: z.enum(['email', 'phone']).nullable().optional(),
    newsletterOptIn: z.boolean().optional(),
    honeypot: z.string().max(0).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.subject === 'Concierge Request') {
      if (!data.startDate?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Check-in date is required for concierge requests',
          path: ['startDate'],
        })
      }
      if (!data.endDate?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Check-out date is required for concierge requests',
          path: ['endDate'],
        })
      }
      if (data.guests == null || data.guests < 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'At least 1 guest is required for concierge requests',
          path: ['guests'],
        })
      }
      if (data.startDate && data.endDate && data.startDate >= data.endDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Check-out must be after check-in',
          path: ['endDate'],
        })
      }
    }
  })

type FormData = z.infer<typeof contactFormSchema>

export interface ContactFormProps {
  user?: User | null
  destinationContext?: {
    destinationId?: string
    name?: string
    slug?: string
  }
  mode?: 'general' | 'concierge'
  onSubmit?: (data: FormData & { isConcierge: boolean }) => void | Promise<void>
  className?: string
}

export function ContactForm({
  user,
  destinationContext,
  mode: initialMode = 'general',
  onSubmit,
  className,
}: ContactFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionResult, setSubmissionResult] = useState<{
    id: string
    reference?: string
  } | null>(null)
  const [destinationId, setDestinationId] = useState<string | null>(
    destinationContext?.destinationId ?? null
  )

  const form = useForm<FormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: user?.full_name ?? '',
      email: user?.email ?? '',
      subject: initialMode === 'concierge' ? 'Concierge Request' : 'General Question',
      message: '',
      destinationId: destinationContext?.destinationId ?? null,
      startDate: '',
      endDate: '',
      guests: null,
      inquiryReference: '',
      preferredContactMethod: 'email',
      newsletterOptIn: false,
      honeypot: '',
    },
  })

  const subject = form.watch('subject')
  const isConcierge = subject === 'Concierge Request'

  useEffect(() => {
    if (user?.full_name) form.setValue('name', user.full_name)
    if (user?.email) form.setValue('email', user.email)
  }, [user?.full_name, user?.email, form])

  useEffect(() => {
    if (destinationContext?.destinationId) {
      setDestinationId(destinationContext.destinationId)
      form.setValue('destinationId', destinationContext.destinationId)
    }
  }, [destinationContext?.destinationId, form])

  const handleSubmit = async (data: FormData) => {
    if (onSubmit) {
      await onSubmit({ ...data, isConcierge } as FormData & { isConcierge: boolean })
      return
    }

    setIsSubmitting(true)
    try {
      const result = await submitContactInquiry({
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        category: SUBJECT_TO_CATEGORY[data.subject] ?? 'general',
        destinationId: (destinationId ?? data.destinationId) ?? undefined,
        startDate: data.startDate?.trim() || undefined,
        endDate: data.endDate?.trim() || undefined,
        guests: data.guests != null && data.guests > 0 ? data.guests : undefined,
        inquiryReference: data.inquiryReference?.trim() || undefined,
        isConcierge,
        preferredContactMethod: (data.preferredContactMethod as PreferredContactMethod) ?? 'email',
        userId: user?.id ?? undefined,
        newsletterOptIn: data.newsletterOptIn ?? false,
        honeypot: data.honeypot ?? '',
      })
      setSubmissionResult({
        id: result.id ?? '',
        reference: result.reference,
      })
      form.reset()
      toast.success('Inquiry submitted. Our team will respond within 24–48 hours.')
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'Failed to submit. Please try again.'
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submissionResult) {
    return (
      <ContactFormSuccess
        reference={submissionResult.reference}
        inquiryId={submissionResult.id}
        onSendAnother={() => setSubmissionResult(null)}
      />
    )
  }

  const subjectOptions = Array.isArray(CONTACT_SUBJECTS) ? CONTACT_SUBJECTS : []
  const contactOptions = Array.isArray(PREFERRED_CONTACT_OPTIONS) ? PREFERRED_CONTACT_OPTIONS : []

  return (
    <Card className={cn('border-border shadow-card', className)}>
      <CardHeader>
        <h2 className="font-serif text-xl font-semibold">Send a message</h2>
        <p className="text-sm text-muted-foreground">
          Choose &quot;General Question&quot; for support, or &quot;Concierge Request&quot; for
          stay-specific inquiries with dates and guests.
        </p>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={form.handleSubmit(handleSubmit, () => toast.error('Please fix the errors below'))}
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
              {form.formState.errors.name && (
                <p id="name-error" className="mt-1 text-sm text-destructive" role="alert">
                  {form.formState.errors.name.message}
                </p>
              )}
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
              {form.formState.errors.email && (
                <p id="email-error" className="mt-1 text-sm text-destructive" role="alert">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="contact-subject">Subject</Label>
            <Select
              value={form.watch('subject') || ''}
              onValueChange={(v) => form.setValue('subject', v)}
            >
              <SelectTrigger id="contact-subject" className="mt-2">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                {subjectOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.subject && (
              <p className="mt-1 text-sm text-destructive" role="alert">
                {form.formState.errors.subject.message}
              </p>
            )}
          </div>

          <DestinationSelector
            value={destinationId}
            onChange={(id) => {
              setDestinationId(id)
              form.setValue('destinationId', id)
            }}
            placeholder="Select a destination (optional)"
          />

          {isConcierge && (
            <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-sm font-medium text-foreground">
                Concierge details (required for stay requests)
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="contact-start-date">Check-in</Label>
                  <Input
                    id="contact-start-date"
                    type="date"
                    className="mt-2"
                    {...form.register('startDate')}
                    aria-invalid={!!form.formState.errors.startDate}
                  />
                  {form.formState.errors.startDate && (
                    <p className="mt-1 text-sm text-destructive" role="alert">
                      {form.formState.errors.startDate.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="contact-end-date">Check-out</Label>
                  <Input
                    id="contact-end-date"
                    type="date"
                    className="mt-2"
                    {...form.register('endDate')}
                    aria-invalid={!!form.formState.errors.endDate}
                  />
                  {form.formState.errors.endDate && (
                    <p className="mt-1 text-sm text-destructive" role="alert">
                      {form.formState.errors.endDate.message}
                    </p>
                  )}
                </div>
              </div>
              <div>
                <Label htmlFor="contact-guests">Number of guests</Label>
                <Input
                  id="contact-guests"
                  type="number"
                  min={1}
                  max={20}
                  className="mt-2 w-24"
                  {...form.register('guests')}
                  aria-invalid={!!form.formState.errors.guests}
                />
                {form.formState.errors.guests && (
                  <p className="mt-1 text-sm text-destructive" role="alert">
                    {form.formState.errors.guests.message}
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <Label htmlFor="contact-message">Message</Label>
            <Textarea
              id="contact-message"
              rows={5}
              className="mt-2"
              placeholder="Tell us how we can help..."
              {...form.register('message')}
              aria-invalid={!!form.formState.errors.message}
              aria-describedby={form.formState.errors.message ? 'message-error' : 'message-count'}
            />
            {form.formState.errors.message && (
              <p id="message-error" className="mt-1 text-sm text-destructive" role="alert">
                {form.formState.errors.message.message}
              </p>
            )}
            <p id="message-count" className="mt-1 text-xs text-muted-foreground">
              {(form.watch('message') ?? '').length} / {MESSAGE_MAX} characters
            </p>
          </div>

          <div>
            <Label htmlFor="contact-inquiry-ref">Inquiry reference (optional)</Label>
            <Input
              id="contact-inquiry-ref"
              placeholder="e.g. RR-12345"
              className="mt-2"
              {...form.register('inquiryReference')}
            />
          </div>

          <div
            className="absolute -left-[9999px] opacity-0 pointer-events-none"
            aria-hidden="true"
          >
            <Label htmlFor="contact-website">Website</Label>
            <Input
              id="contact-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              {...form.register('honeypot')}
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="contact-newsletter"
              className="rounded border-border"
              {...form.register('newsletterOptIn')}
            />
            <Label htmlFor="contact-newsletter" className="font-normal cursor-pointer">
              I&apos;d like to receive occasional updates and offers from Roam Resort
            </Label>
          </div>

          <div>
            <Label htmlFor="contact-method">Preferred contact method</Label>
            <Select
              value={form.watch('preferredContactMethod') ?? 'email'}
              onValueChange={(v) => form.setValue('preferredContactMethod', v as PreferredContactMethod)}
            >
              <SelectTrigger id="contact-method" className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {contactOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting}
            className="bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-accent-glow"
            size="lg"
          >
            {isSubmitting ? 'Submitting…' : 'Submit Inquiry'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
