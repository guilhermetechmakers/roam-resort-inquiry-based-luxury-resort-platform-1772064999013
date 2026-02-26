import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { MessageCircle, CheckCircle2 } from 'lucide-react'
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
import { DestinationSelector } from '@/components/contact/destination-selector'
import { submitContactInquiry } from '@/api/contact-inquiries'
import { useAuth } from '@/contexts/auth-context'
import {
  SUBJECT_OPTIONS,
  PREFERRED_CONTACT_OPTIONS,
  isConciergeSubject,
} from '@/lib/validation/contact-inquiry-validation'
import { cn } from '@/lib/utils'

const contactFormSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email'),
    subject: z.string().min(1, 'Subject is required'),
    message: z
      .string()
      .min(10, 'Message must be at least 10 characters')
      .max(5000, 'Message must be 5000 characters or less'),
    destinationId: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    guests: z.coerce.number().min(0).max(99).optional(),
    inquiryReference: z.string().max(50).optional(),
    preferredContactMethod: z.string().optional(),
  })
  .refine(
    (data) => {
      if (!isConciergeSubject(data.subject)) return true
      return !!(data.startDate && data.endDate && data.guests && data.guests >= 1)
    },
    {
      message: 'Dates and guests are required for Concierge Request',
      path: ['startDate'],
    }
  )

type ContactFormData = z.infer<typeof contactFormSchema>

export interface ContactFormPageProps {
  user?: { id?: string; email?: string; full_name?: string } | null
  destinationContext?: { destinationId?: string; name?: string; images?: string[] }
  mode?: 'general' | 'concierge'
  onSubmit?: (data: ContactFormData) => void | Promise<void>
  className?: string
}

export function ContactFormPage({
  user,
  destinationContext,
  mode = 'general',
  onSubmit,
  className,
}: ContactFormPageProps) {
  const { user: authUser } = useAuth()
  const effectiveUser = user ?? authUser
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [serverErrors, setServerErrors] = useState<string[]>([])
  const [submissionResult, setSubmissionResult] = useState<{ id: string; reference?: string } | null>(null)

  const form = useForm<ContactFormData>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: '',
      email: '',
      subject: mode === 'concierge' ? 'Concierge Request' : 'General Question',
      message: '',
      destinationId: destinationContext?.destinationId ?? '',
      startDate: '',
      endDate: '',
      guests: 0,
      inquiryReference: '',
      preferredContactMethod: 'email',
    },
  })

  useEffect(() => {
    if (effectiveUser) {
      form.setValue('name', effectiveUser.full_name ?? '')
      form.setValue('email', effectiveUser.email ?? '')
    }
  }, [effectiveUser, form])

  useEffect(() => {
    const id = destinationContext?.destinationId
    if (id) {
      form.setValue('destinationId', id)
    }
  }, [destinationContext?.destinationId, form])

  const wantsConcierge = isConciergeSubject(form.watch('subject'))

  const handleSubmit = async (data: ContactFormData) => {
    if (onSubmit) {
      await onSubmit(data)
      return
    }

    setIsSubmitting(true)
    setServerErrors([])
    setSubmissionStatus('idle')

    try {
      const payload = {
        name: data.name.trim(),
        email: data.email.trim(),
        subject: data.subject,
        message: data.message.trim(),
        destinationId: data.destinationId?.trim() || undefined,
        startDate: data.startDate?.trim() || undefined,
        endDate: data.endDate?.trim() || undefined,
        guests: data.guests && data.guests > 0 ? data.guests : undefined,
        inquiryReference: data.inquiryReference?.trim() || undefined,
        isConcierge: wantsConcierge,
        preferredContactMethod: data.preferredContactMethod || undefined,
        userId: effectiveUser?.id || undefined,
      }

      const result = await submitContactInquiry(payload)

      setSubmissionStatus('success')
      setSubmissionResult({ id: result.id ?? '', reference: result.reference })
      form.reset({
        name: (effectiveUser?.full_name ?? '') as string,
        email: (effectiveUser?.email ?? '') as string,
        subject: 'General Question',
        message: '',
        destinationId: '',
        startDate: '',
        endDate: '',
        guests: 0,
        inquiryReference: '',
        preferredContactMethod: 'email',
      })
      toast.success('Message sent. Our concierge team will respond within 24 hours.')
    } catch (err) {
      const msg = (err as { message?: string })?.message ?? 'Failed to send message'
      setSubmissionStatus('error')
      setServerErrors([msg])
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submissionStatus === 'success') {
    return (
      <Card
        className={cn(
          'border-accent/30 shadow-card overflow-hidden animate-fade-in',
          className
        )}
      >
        <CardContent className="pt-8 pb-8">
          <div className="flex flex-col items-center text-center">
            <div className="rounded-full bg-accent/10 p-4 mb-6">
              <CheckCircle2 className="h-12 w-12 text-accent" />
            </div>
            <h2 className="font-serif text-2xl font-semibold text-foreground">
              Thank you for reaching out
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground leading-relaxed">
              Our concierge team will respond within 24 hours on business days. You will receive a
              confirmation email shortly.
            </p>
            {submissionResult?.reference && (
              <p className="mt-2 text-sm text-muted-foreground">
                Reference: <strong className="text-foreground">{submissionResult.reference}</strong>
              </p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              Need immediate assistance? Email us at{' '}
              <a
                href="mailto:concierge@roamresort.com"
                className="text-accent hover:underline"
              >
                concierge@roamresort.com
              </a>
            </p>
            <Button
              variant="outline"
              className="mt-8 hover:bg-accent/10 hover:border-accent/30 transition-all"
              onClick={() => {
                setSubmissionStatus('idle')
                setSubmissionResult(null)
              }}
            >
              Send another message
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const subjectOptions = Array.isArray(SUBJECT_OPTIONS) ? [...SUBJECT_OPTIONS] : []

  return (
    <div className={cn('space-y-8', className)}>
      <Card className="border-border shadow-card overflow-hidden">
        <CardHeader className="border-b border-border bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent/10 p-2">
              <MessageCircle className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-semibold">Send a message</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                General questions or concierge requests — we&apos;re here to help.
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
            noValidate
          >
            {serverErrors.length > 0 && (
              <div
                role="alert"
                className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive"
              >
                <ul className="list-disc list-inside space-y-1">
                  {serverErrors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Name</Label>
                <Input
                  id="contact-name"
                  {...form.register('name')}
                  aria-invalid={!!form.formState.errors.name}
                  aria-describedby={form.formState.errors.name ? 'name-error' : undefined}
                  placeholder="Your name"
                  className="transition-all duration-200 focus:ring-accent/30"
                />
                {form.formState.errors.name && (
                  <p id="name-error" className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  {...form.register('email')}
                  aria-invalid={!!form.formState.errors.email}
                  aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
                  placeholder="you@example.com"
                  className="transition-all duration-200 focus:ring-accent/30"
                />
                {form.formState.errors.email && (
                  <p id="email-error" className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contact-subject">Subject</Label>
              <Select
                value={form.watch('subject')}
                onValueChange={(v) => form.setValue('subject', v)}
              >
                <SelectTrigger
                  id="contact-subject"
                  aria-invalid={!!form.formState.errors.subject}
                  className="transition-all duration-200 focus:ring-accent/30"
                >
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjectOptions.map((opt) => (
                    <SelectItem key={opt} value={opt}>
                      {opt}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.subject && (
                <p className="text-sm text-destructive">{form.formState.errors.subject.message}</p>
              )}
            </div>

            <DestinationSelector
              value={form.watch('destinationId') ?? null}
              onChange={(id) => form.setValue('destinationId', id ?? '')}
              placeholder="Select a destination (optional)"
            />

            {wantsConcierge && (
              <div className="grid gap-4 sm:grid-cols-3 space-y-4 sm:space-y-0">
                <div className="space-y-2">
                  <Label htmlFor="contact-start-date">Check-in</Label>
                  <Input
                    id="contact-start-date"
                    type="date"
                    {...form.register('startDate')}
                    aria-invalid={!!form.formState.errors.startDate}
                    className="transition-all duration-200 focus:ring-accent/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-end-date">Check-out</Label>
                  <Input
                    id="contact-end-date"
                    type="date"
                    {...form.register('endDate')}
                    aria-invalid={!!form.formState.errors.endDate}
                    className="transition-all duration-200 focus:ring-accent/30"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-guests">Guests</Label>
                  <Input
                    id="contact-guests"
                    type="number"
                    min={1}
                    max={99}
                    {...form.register('guests')}
                    aria-invalid={!!form.formState.errors.guests}
                    className="transition-all duration-200 focus:ring-accent/30"
                  />
                </div>
                {(form.formState.errors.startDate || form.formState.errors.guests) && (
                  <p className="text-sm text-destructive col-span-3">
                    {form.formState.errors.startDate?.message ??
                      form.formState.errors.guests?.message ??
                      'Dates and guests are required for concierge requests'}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="contact-message">Message</Label>
              <Textarea
                id="contact-message"
                rows={5}
                {...form.register('message')}
                aria-invalid={!!form.formState.errors.message}
                aria-describedby={form.formState.errors.message ? 'message-error' : undefined}
                placeholder="Tell us how we can help..."
                className="transition-all duration-200 focus:ring-accent/30 resize-none"
              />
              <div className="flex justify-between">
                <span className="text-xs text-muted-foreground">
                  {(form.watch('message')?.length ?? 0)} / 5000 characters
                </span>
                {form.formState.errors.message && (
                  <p id="message-error" className="text-sm text-destructive">
                    {form.formState.errors.message.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="contact-reference">Inquiry Reference (optional)</Label>
                <Input
                  id="contact-reference"
                  {...form.register('inquiryReference')}
                  placeholder="e.g. RR-12345"
                  className="transition-all duration-200 focus:ring-accent/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-method">Preferred Contact Method</Label>
                <Select
                  value={form.watch('preferredContactMethod') ?? 'email'}
                  onValueChange={(v) => form.setValue('preferredContactMethod', v)}
                >
                  <SelectTrigger id="contact-method" className="transition-all duration-200 focus:ring-accent/30">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PREFERRED_CONTACT_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-accent hover:bg-accent/90 text-accent-foreground shadow-accent-glow hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-70"
            >
              {isSubmitting ? 'Sending…' : 'Submit Inquiry'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
