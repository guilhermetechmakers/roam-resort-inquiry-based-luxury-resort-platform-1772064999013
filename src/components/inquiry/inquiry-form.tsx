import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { AttachmentUploader, type AttachmentFile } from './attachment-uploader'
import { useDraftAutoSave } from '@/hooks/use-draft-autosave'
import { ROOM_PREF_OPTIONS } from '@/lib/validation/inquiry-validation'
import { isPastDate, isValidDateRange } from '@/lib/validation/inquiry-validation'
import { ValidationSummary } from '@/components/ux'
import { cn } from '@/lib/utils'

const NOTES_MAX = 1000

const inquirySchema = z
  .object({
    arrival_date: z.string().min(1, 'Arrival date required'),
    departure_date: z.string().min(1, 'Departure date required'),
    flexible_dates: z.boolean().default(false),
    guests: z.coerce.number().min(1, 'At least 1 guest').max(20),
    rooms_count: z.coerce.number().min(1, 'At least 1 room').max(10).optional(),
    room_prefs: z.array(z.string()).min(1, 'Select at least one room preference'),
    budget_hint: z.string().max(100).optional(),
    notes: z.string().min(10, 'Message must be at least 10 characters').max(NOTES_MAX),
    contact_email: z.boolean().default(true),
    contact_sms: z.boolean().default(false),
    contact_phone: z.boolean().default(false),
    consent_privacy: z.boolean().refine((v) => v === true, 'You must accept the Privacy Policy'),
    consent_terms: z.boolean().refine((v) => v === true, 'You must accept the Terms of Service'),
  })
  .refine(
    (d) => !isPastDate(d.arrival_date),
    { message: 'Arrival date must be today or in the future', path: ['arrival_date'] }
  )
  .refine(
    (d) => isValidDateRange(d.arrival_date, d.departure_date),
    { message: 'Departure must be after arrival', path: ['departure_date'] }
  )
  .refine(
    (d) => d.contact_email || d.contact_sms || d.contact_phone,
    { message: 'Select at least one contact preference', path: ['contact_email'] }
  )

type FormData = z.infer<typeof inquirySchema>

export interface InquiryFormProps {
  destinationId: string
  destinationName: string
  existingDraft?: Partial<FormData> & { draftId?: string }
  onSubmit: (data: FormData & { attachments: AttachmentFile[] }) => Promise<void>
  onSaveDraft?: (data: FormData & { attachments: AttachmentFile[] }) => void | Promise<void>
  isSubmitting?: boolean
  className?: string
}

export type InquiryFormSubmitData = FormData & { attachments: AttachmentFile[] }

const defaultValues: FormData = {
  arrival_date: '',
  departure_date: '',
  flexible_dates: false,
  guests: 2,
  rooms_count: 1,
  room_prefs: [],
  budget_hint: '',
  notes: '',
  contact_email: true,
  contact_sms: false,
  contact_phone: false,
  consent_privacy: false,
  consent_terms: false,
}

export function InquiryForm({
  destinationId: _destinationId,
  destinationName,
  existingDraft,
  onSubmit,
  onSaveDraft,
  isSubmitting = false,
  className,
}: InquiryFormProps) {
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])

  const form = useForm<FormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      ...defaultValues,
      ...existingDraft,
      room_prefs: (existingDraft?.room_prefs ?? []) as string[],
    },
  })

  const formData = form.watch()
  useDraftAutoSave({
    data: formData,
    onSave: (d) => onSaveDraft?.({ ...d, attachments }),
    delay: 60_000,
    enabled: !!onSaveDraft,
  })

  const errors = form.formState.errors ?? {}
  const errorEntries = Object.entries(errors)
    .filter(([, v]) => v?.message)
    .map(([key, v]) => ({ field: key, message: String(v?.message ?? '') }))
  const hasErrors = errorEntries.length > 0

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit({ ...data, attachments })
  })

  return (
    <form
      onSubmit={handleSubmit}
      className={cn('space-y-8', className)}
      noValidate
      aria-describedby={hasErrors ? 'form-errors' : undefined}
    >
      {hasErrors && (
        <ValidationSummary
          id="form-errors"
          errors={errorEntries}
          title="Please fix the following:"
        />
      )}

      <div className="rounded-lg border border-border bg-secondary/20 p-4">
        <Label className="text-muted-foreground uppercase tracking-wide">Destination</Label>
        <p className="mt-1 font-medium">{destinationName}</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="arrival_date">Arrival Date</Label>
          <Input
            id="arrival_date"
            type="date"
            className="mt-2 bg-background"
            {...form.register('arrival_date')}
            aria-invalid={!!errors.arrival_date}
            aria-describedby={errors.arrival_date ? 'arrival_error' : undefined}
          />
          {errors.arrival_date && (
            <p id="arrival_error" className="mt-1 text-sm text-destructive" role="alert">
              {errors.arrival_date.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="departure_date">Departure Date</Label>
          <Input
            id="departure_date"
            type="date"
            className="mt-2 bg-background"
            {...form.register('departure_date')}
            aria-invalid={!!errors.departure_date}
            aria-describedby={errors.departure_date ? 'departure_error' : undefined}
          />
          {errors.departure_date && (
            <p id="departure_error" className="mt-1 text-sm text-destructive" role="alert">
              {errors.departure_date.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          id="flexible_dates"
          checked={form.watch('flexible_dates')}
          onCheckedChange={(v) => form.setValue('flexible_dates', !!v)}
          aria-describedby="flexible_hint"
        />
        <Label htmlFor="flexible_dates" className="cursor-pointer font-normal">
          My dates are flexible
        </Label>
        <span id="flexible_hint" className="sr-only">
          Check if your travel dates can be adjusted
        </span>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <Label htmlFor="guests">Number of Guests</Label>
          <Input
            id="guests"
            type="number"
            min={1}
            max={20}
            className="mt-2 w-24 bg-background"
            {...form.register('guests')}
            aria-invalid={!!errors.guests}
          />
          {errors.guests && (
            <p className="mt-1 text-sm text-destructive" role="alert">
              {errors.guests.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="rooms_count">Number of Rooms</Label>
          <Input
            id="rooms_count"
            type="number"
            min={1}
            max={10}
            className="mt-2 w-24 bg-background"
            {...form.register('rooms_count')}
            aria-invalid={!!errors.rooms_count}
          />
          {errors.rooms_count && (
            <p className="mt-1 text-sm text-destructive" role="alert">
              {errors.rooms_count.message}
            </p>
          )}
        </div>
      </div>

      <div>
        <Label className="mb-2 block">Room / Suite Preferences</Label>
        <div className="flex flex-wrap gap-4">
          {ROOM_PREF_OPTIONS.map((opt) => {
            const prefs = form.watch('room_prefs') ?? []
            const checked = prefs.includes(opt)
            return (
              <div key={opt} className="flex items-center gap-2">
                <Checkbox
                  id={`room_${opt}`}
                  checked={checked}
                  onCheckedChange={(v) => {
                    const current = form.getValues('room_prefs') ?? []
                    const next = v
                      ? [...current, opt]
                      : current.filter((x) => x !== opt)
                    form.setValue('room_prefs', next)
                  }}
                  aria-invalid={!!errors.room_prefs}
                />
                <Label htmlFor={`room_${opt}`} className="cursor-pointer font-normal">
                  {opt}
                </Label>
              </div>
            )
          })}
        </div>
        {errors.room_prefs && (
          <p className="mt-1 text-sm text-destructive" role="alert">
            {errors.room_prefs.message}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="budget_hint">Budget Hint (optional)</Label>
        <Input
          id="budget_hint"
          placeholder="e.g. Mid-range, Luxury"
          className="mt-2 bg-background"
          {...form.register('budget_hint')}
        />
      </div>

      <div>
        <Label htmlFor="notes">Special Requests / Notes</Label>
        <Textarea
          id="notes"
          placeholder="Tell us about your stay preferences, dietary needs, celebrations..."
          rows={5}
          className="mt-2 bg-background"
          {...form.register('notes')}
          maxLength={NOTES_MAX}
          aria-describedby="notes_count"
        />
        <p id="notes_count" className="mt-1 text-xs text-muted-foreground">
          {(form.watch('notes') ?? '').length} / {NOTES_MAX}
        </p>
      </div>

      <div>
        <Label className="mb-3 block">Attachments (optional)</Label>
        <AttachmentUploader files={attachments} onFilesChange={setAttachments} />
      </div>

      <div>
        <Label className="mb-3 block">Contact Preferences</Label>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-2">
            <Checkbox
              id="contact_email"
              checked={form.watch('contact_email')}
              onCheckedChange={(v) => form.setValue('contact_email', !!v)}
            />
            <Label htmlFor="contact_email" className="font-normal">
              Email
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="contact_sms"
              checked={form.watch('contact_sms')}
              onCheckedChange={(v) => form.setValue('contact_sms', !!v)}
            />
            <Label htmlFor="contact_sms" className="font-normal">
              SMS
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="contact_phone"
              checked={form.watch('contact_phone')}
              onCheckedChange={(v) => form.setValue('contact_phone', !!v)}
            />
            <Label htmlFor="contact_phone" className="font-normal">
              Phone
            </Label>
          </div>
        </div>
        {errors.contact_email && (
          <p className="mt-1 text-sm text-destructive" role="alert">
            {errors.contact_email.message}
          </p>
        )}
      </div>

      <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
        <p className="text-sm font-medium text-foreground">Consent</p>
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="consent_privacy"
              checked={form.watch('consent_privacy')}
              onCheckedChange={(v) => form.setValue('consent_privacy', !!v)}
              aria-invalid={!!errors.consent_privacy}
            />
            <Label htmlFor="consent_privacy" className="cursor-pointer font-normal text-sm leading-relaxed">
              I have read and accept the{' '}
              <Link to="/privacy" className="text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded">
                Privacy Policy
              </Link>
            </Label>
          </div>
          {errors.consent_privacy && (
            <p className="text-sm text-destructive" role="alert">
              {errors.consent_privacy.message}
            </p>
          )}
          <div className="flex items-start gap-3">
            <Checkbox
              id="consent_terms"
              checked={form.watch('consent_terms')}
              onCheckedChange={(v) => form.setValue('consent_terms', !!v)}
              aria-invalid={!!errors.consent_terms}
            />
            <Label htmlFor="consent_terms" className="cursor-pointer font-normal text-sm leading-relaxed">
              I have read and accept the{' '}
              <Link to="/terms" className="text-accent hover:underline focus:outline-none focus:ring-2 focus:ring-ring rounded">
                Terms of Service
              </Link>
            </Label>
          </div>
          {errors.consent_terms && (
            <p className="text-sm text-destructive" role="alert">
              {errors.consent_terms.message}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-accent text-accent-foreground hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.98] transition-all"
          size="lg"
        >
          {isSubmitting ? 'Submitting...' : 'Submit Inquiry'}
        </Button>
        {onSaveDraft && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const data = form.getValues()
              onSaveDraft({ ...data, attachments })
            }}
            className="border-accent/50"
          >
            Save as Draft
          </Button>
        )}
      </div>
    </form>
  )
}
