import * as React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
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
import { ImageUpload } from './image-upload'
import { PreviewPanel } from './preview-panel'
import { PublishToggle } from './publish-toggle'
import { listingFormSchema, validateListingForPublish, type ListingFormValues } from '@/lib/validation/listing-schema'
import { useMemo } from 'react'
import type { Listing, ListingStatus } from '@/types'

const REGION_OPTIONS = ['Santorini', 'Switzerland', 'Kenya', 'Italy', 'France', 'Morocco']
const STYLE_OPTIONS = ['Coastal', 'Alpine', 'Safari', 'Cultural']

export interface ListingFormProps {
  listing?: Listing | null
  onSubmit: (values: ListingFormValues & { galleryUrls: string[]; status: ListingStatus }) => void
  isSubmitting?: boolean
  className?: string
}

function listingToFormValues(listing: Listing): ListingFormValues & { galleryUrls: string[] } {
  const urls = Array.isArray(listing.gallery_urls) ? listing.gallery_urls : []
  const exp = listing.experienceDetails
  return {
    title: listing.title ?? '',
    subtitle: listing.subtitle ?? '',
    region: listing.region ?? '',
    style: listing.style ?? '',
    narrative: listing.editorial_content ?? '',
    experienceDetails: listing.experience_details ?? '',
    guestCapacity: listing.capacity ?? undefined,
    datesSuggestion: exp?.datesSuggestion?.join('\n') ?? '',
    amenities: exp?.amenities?.join(', ') ?? '',
    sampleItineraries: exp?.sampleItineraries?.join('\n') ?? '',
    galleryUrls: urls,
  }
}

export function ListingForm({
  listing,
  onSubmit,
  isSubmitting,
  className,
}: ListingFormProps) {
  const [status, setStatus] = React.useState<ListingStatus>(listing?.status ?? 'draft')
  const [galleryUrls, setGalleryUrls] = React.useState<string[]>(
    Array.isArray(listing?.gallery_urls) ? listing.gallery_urls : []
  )

  const defaultValues = useMemo(
    () => (listing ? listingToFormValues(listing) : {
      title: '',
      subtitle: '',
      region: '',
      style: '',
      narrative: '',
      experienceDetails: '',
      guestCapacity: undefined,
      datesSuggestion: '',
      amenities: '',
      sampleItineraries: '',
      galleryUrls: [],
    }),
    [listing]
  )

  const form = useForm<ListingFormValues>({
    resolver: zodResolver(listingFormSchema),
    defaultValues: {
      title: defaultValues.title,
      subtitle: defaultValues.subtitle,
      region: defaultValues.region,
      style: defaultValues.style,
      narrative: defaultValues.narrative,
      experienceDetails: defaultValues.experienceDetails,
      guestCapacity: defaultValues.guestCapacity,
      datesSuggestion: defaultValues.datesSuggestion,
      amenities: defaultValues.amenities,
      sampleItineraries: defaultValues.sampleItineraries,
    },
  })

  const watchTitle = form.watch('title')
  const watchSubtitle = form.watch('subtitle')
  const watchRegion = form.watch('region')
  const watchStyle = form.watch('style')
  const watchNarrative = form.watch('narrative')

  const validationResult = useMemo(
    () =>
      validateListingForPublish({
        title: watchTitle,
        region: watchRegion,
        style: watchStyle,
        narrative: watchNarrative,
        galleryUrls,
      }),
    [watchTitle, watchRegion, watchStyle, watchNarrative, galleryUrls]
  )

  const handleSubmit = form.handleSubmit((values) => {
    onSubmit({
      ...values,
      galleryUrls,
      status,
    })
  })

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                className="mt-2"
                {...form.register('title')}
              />
              {form.formState.errors.title && (
                <p className="mt-1 text-sm text-destructive">
                  {form.formState.errors.title.message}
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="subtitle">Subtitle / Tagline</Label>
              <Input
                id="subtitle"
                className="mt-2"
                {...form.register('subtitle')}
              />
            </div>
            <div>
              <Label htmlFor="region">Region</Label>
              <Select
                value={form.watch('region')}
                onValueChange={(v) => form.setValue('region', v)}
              >
                <SelectTrigger id="region" className="mt-2">
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {REGION_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.region && (
                <p className="mt-1 text-sm text-destructive">
                  {form.formState.errors.region.message}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="style">Style</Label>
              <Select
                value={form.watch('style')}
                onValueChange={(v) => form.setValue('style', v)}
              >
                <SelectTrigger id="style" className="mt-2">
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  {STYLE_OPTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.style && (
                <p className="mt-1 text-sm text-destructive">
                  {form.formState.errors.style.message}
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="narrative">Editorial narrative (min 100 chars)</Label>
            <Textarea
              id="narrative"
              rows={8}
              className="mt-2"
              placeholder="Tell the story of your destination. Use ## for headings, > for pull quotes."
              {...form.register('narrative')}
            />
            {form.formState.errors.narrative && (
              <p className="mt-1 text-sm text-destructive">
                {form.formState.errors.narrative.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="experienceDetails">Experience details (summary)</Label>
            <Textarea
              id="experienceDetails"
              rows={3}
              className="mt-2"
              {...form.register('experienceDetails')}
            />
          </div>

          <div>
            <Label htmlFor="guestCapacity">Guest capacity</Label>
            <Input
              id="guestCapacity"
              type="number"
              min={1}
              max={50}
              className="mt-2 w-24"
              {...form.register('guestCapacity')}
            />
          </div>

          <div>
            <Label>Image gallery</Label>
            <ImageUpload
              images={galleryUrls}
              onChange={setGalleryUrls}
              className="mt-2"
            />
          </div>
        </div>

        <div className="space-y-6">
          <PreviewPanel
            title={watchTitle || 'Untitled'}
            subtitle={watchSubtitle}
            region={watchRegion}
            style={watchStyle}
            narrative={watchNarrative}
            galleryUrls={galleryUrls}
            slug={listing?.slug}
            listingId={listing?.id}
          />
          <PublishToggle
            status={status}
            onStatusChange={setStatus}
            validationErrors={status === 'live' ? validationResult.errors : []}
            disabled={isSubmitting}
          />
          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>
    </form>
  )
}
