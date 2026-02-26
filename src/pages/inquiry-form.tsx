import { useParams, Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/auth-context'
import { useListingById } from '@/hooks/use-listings'
import { useCreateInquiry } from '@/hooks/use-inquiries'
import { Skeleton } from '@/components/ui/skeleton'

const schema = z.object({
  check_in: z.string().min(1, 'Check-in date required'),
  check_out: z.string().min(1, 'Check-out date required'),
  guests_count: z.coerce.number().min(1, 'At least 1 guest').max(20),
  message: z.string().optional(),
})

type FormData = z.infer<typeof schema>

export function InquiryFormPage() {
  const { listingId } = useParams<{ listingId: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated, isLoading: authLoading } = useAuth()
  const { data: listing, isLoading } = useListingById(listingId)
  const createInquiry = useCreateInquiry()

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      check_in: '',
      check_out: '',
      guests_count: 2,
      message: '',
    },
  })

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Skeleton className="h-12 w-48" />
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center">
        <h2 className="font-serif text-2xl font-semibold">Sign in to submit an inquiry</h2>
        <Link to="/login" className="mt-4">
          <Button>Sign In</Button>
        </Link>
      </div>
    )
  }

  if (!listingId) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">No listing selected.</p>
        <Link to="/destinations" className="ml-4">
          <Button>Browse Destinations</Button>
        </Link>
      </div>
    )
  }

  if (isLoading && !listing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <Skeleton className="h-96 rounded-xl" />
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Listing not found.</p>
        <Link to="/destinations" className="ml-4">
          <Button>Browse Destinations</Button>
        </Link>
      </div>
    )
  }

  const onSubmit = async (data: FormData) => {
    if (!user) return
    try {
      const inquiry = await createInquiry.mutateAsync({
        guest_id: user.id,
        listing_id: listing.id,
        check_in: data.check_in,
        check_out: data.check_out,
        guests_count: data.guests_count,
        message: data.message,
      })
      toast.success('Inquiry submitted successfully!')
      navigate(`/inquiry/confirmation/${inquiry.reference}`)
    } catch (err) {
      toast.error((err as Error).message ?? 'Failed to submit inquiry')
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-serif text-3xl font-bold">Request a Stay</h1>
      <p className="mt-2 text-muted-foreground">{listing.title}</p>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="check_in">Check-in</Label>
            <Input
              id="check_in"
              type="date"
              className="mt-2"
              {...form.register('check_in')}
            />
            {form.formState.errors.check_in && (
              <p className="mt-1 text-sm text-destructive">
                {form.formState.errors.check_in.message}
              </p>
            )}
          </div>
          <div>
            <Label htmlFor="check_out">Check-out</Label>
            <Input
              id="check_out"
              type="date"
              className="mt-2"
              {...form.register('check_out')}
            />
            {form.formState.errors.check_out && (
              <p className="mt-1 text-sm text-destructive">
                {form.formState.errors.check_out.message}
              </p>
            )}
          </div>
        </div>
        <div>
          <Label htmlFor="guests_count">Number of Guests</Label>
          <Input
            id="guests_count"
            type="number"
            min={1}
            max={20}
            className="mt-2"
            {...form.register('guests_count')}
          />
          {form.formState.errors.guests_count && (
            <p className="mt-1 text-sm text-destructive">
              {form.formState.errors.guests_count.message}
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="message">Message (optional)</Label>
          <Textarea
            id="message"
            placeholder="Tell us about your stay preferences..."
            rows={5}
            className="mt-2"
            {...form.register('message')}
          />
        </div>
        <div className="flex gap-4">
          <Button type="submit" disabled={createInquiry.isPending}>
            {createInquiry.isPending ? 'Submitting...' : 'Submit Inquiry'}
          </Button>
          <Link to="/destinations">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
        </div>
      </form>
    </div>
  )
}
