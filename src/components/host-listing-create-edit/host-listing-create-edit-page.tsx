import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sidebar } from '@/components/layout/sidebar'
import { hostSidebarLinks } from '@/components/layout/sidebar-links'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/use-auth'
import { useListingById } from '@/hooks/use-listings'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { MultiTabNavigator, type HostListingTabId } from './multi-tab-navigator'
import { BasicInfoTab } from './basic-info-tab'
import { EditorialContentTab } from './editorial-content-tab'
import { GalleryUploader } from './gallery-uploader'
import { ExperienceDetailsForm } from './experience-details-form'
import { SEOEditor } from './seo-editor'
import { PublishControls } from './publish-controls'
import { PreviewModal } from './preview-modal'
import { ValidationSummary } from './validation-summary'
import type { HostListingFormData, GalleryItem } from '@/types/host-listing-create-edit'
import {
  DEFAULT_FORM_DATA,
  DEFAULT_EXPERIENCE,
  DEFAULT_METADATA,
} from '@/types/host-listing-create-edit'
import { validateHostListingForPublish } from '@/lib/validation/host-listing-schema'
import {
  fetchListingForEdit,
  apiListingToFormData,
  createHostListing,
  updateHostListing,
} from '@/api/host-listing-create-edit'
import { autosaveListing } from '@/api/host-listings'
import type { Listing } from '@/types'
import { ensureArray } from '@/lib/utils/array-utils'

const AUTOSAVE_DEBOUNCE_MS = 60_000

function slugFromTitle(title: string): string {
  return (title ?? '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

const INITIAL_DATA: HostListingFormData = {
  ...DEFAULT_FORM_DATA,
  experience: { ...DEFAULT_EXPERIENCE },
  seo: { ...DEFAULT_METADATA },
}

export function HostListingCreateEditPage() {
  const { listingId } = useParams<{ listingId: string }>()
  const navigate = useNavigate()
  const isNew = listingId === 'new' || !listingId
  const { hasRole, isLoading: authLoading } = useAuth()
  const { data: listing, isLoading } = useListingById(
    isNew ? undefined : listingId ?? undefined
  )

  const [activeTab, setActiveTab] = useState<HostListingTabId>('basic')
  const [formData, setFormData] = useState<HostListingFormData>(INITIAL_DATA)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [autosaveStatus, setAutosaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const autosaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const queryClient = useQueryClient()

  const updateForm = useCallback((updates: Partial<HostListingFormData>) => {
    setFormData((prev) => ({ ...prev, ...updates }))
  }, [])

  const updateExperience = useCallback(
    (experience: HostListingFormData['experience']) => {
      updateForm({ experience })
    },
    [updateForm]
  )

  const updateSeo = useCallback(
    (seo: HostListingFormData['seo']) => {
      updateForm({ seo })
    },
    [updateForm]
  )

  const updateGallery = useCallback(
    (gallery: HostListingFormData['gallery']) => {
      updateForm({ gallery: gallery ?? [] })
    },
    [updateForm]
  )

  useEffect(() => {
    if (isNew) return
    const load = async () => {
      if (listing) {
        const mapped = apiListingToFormData(listing as Listing)
        if (mapped) setFormData(mapped)
      } else if (listingId) {
        const fetched = await fetchListingForEdit(listingId)
        if (fetched) setFormData(fetched)
      }
    }
    load()
  }, [isNew, listing, listingId])

  useEffect(() => {
    if (!formData.slug && formData.title) {
      setFormData((prev) => ({
        ...prev,
        slug: slugFromTitle(prev.title),
        seo: {
          ...prev.seo,
          metaTitle: prev.seo?.metaTitle || prev.title,
          metaDescription: prev.seo?.metaDescription || prev.tagline || '',
        },
      }))
    }
  }, [formData.title, formData.tagline])

  // Debounced autosave for existing draft listings
  useEffect(() => {
    const listingId = formData.id
    if (!listingId || isNew || isSubmitting) return

    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current)
      autosaveTimerRef.current = null
    }

    autosaveTimerRef.current = setTimeout(async () => {
      autosaveTimerRef.current = null
      setAutosaveStatus('saving')
      try {
        const slug = formData.slug || slugFromTitle(formData.title) || `listing-${Date.now()}`
        const payload = {
          title: formData.title || 'Untitled',
          subtitle: formData.tagline,
          region: formData.locationCity,
          style: formData.category || formData.locationCity,
          slug,
          editorial_content: formData.editorialContent,
          gallery_urls: ensureArray<GalleryItem>(formData.gallery).map((g) => g.imageUrl).filter(Boolean),
          experienceDetails: {
            guestCapacity: formData.experience?.capacity ?? 4,
            amenities: formData.experience?.amenities ?? [],
            sampleItineraries: formData.experience?.activities ?? [],
          },
          status: 'draft' as const,
        }
        const { savedAt } = await autosaveListing(listingId, payload)
        setLastSavedAt(savedAt)
        setAutosaveStatus('saved')
        queryClient.invalidateQueries({ queryKey: ['listing', 'id', listingId] })
        setTimeout(() => setAutosaveStatus('idle'), 3000)
      } catch {
        setAutosaveStatus('error')
        setTimeout(() => setAutosaveStatus('idle'), 5000)
      }
    }, AUTOSAVE_DEBOUNCE_MS)

    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current)
      }
    }
  }, [
    formData.id,
    formData.title,
    formData.tagline,
    formData.category,
    formData.locationCity,
    formData.locationCountry,
    formData.slug,
    formData.editorialContent,
    formData.gallery,
    formData.experience,
    isNew,
    isSubmitting,
    queryClient,
  ])

  const validation = useMemo(
    () =>
      validateHostListingForPublish({
        title: formData.title,
        tagline: formData.tagline,
        category: formData.category,
        locationCity: formData.locationCity,
        locationCountry: formData.locationCountry,
        editorialContent: formData.editorialContent,
        gallery: formData.gallery,
        seo: formData.seo,
      }),
    [formData]
  )

  const handleSaveDraft = useCallback(async () => {
    setIsSubmitting(true)
    try {
      const slug =
        formData.slug || slugFromTitle(formData.title) || `listing-${Date.now()}`
      const payload = {
        title: formData.title || 'Untitled',
        tagline: formData.tagline,
        category: formData.category || formData.locationCity,
        locationCity: formData.locationCity,
        locationCountry: formData.locationCountry,
        slug,
        editorialContent: formData.editorialContent,
        gallery: ensureArray<GalleryItem>(formData.gallery),
        experience: formData.experience ?? INITIAL_DATA.experience,
        seo: formData.seo ?? INITIAL_DATA.seo,
        isPublished: false,
      }

      if (isNew) {
        const created = await createHostListing(payload)
        toast.success('Draft saved')
        navigate(`/host/listings/${created.id}`)
      } else if (formData.id) {
        await updateHostListing(formData.id, { ...payload, isPublished: false })
        toast.success('Draft saved')
      }
    } catch (err) {
      toast.error((err as Error).message ?? 'Failed to save draft')
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, isNew, navigate])

  const handlePublish = useCallback(async () => {
    if (!validation.isValid) {
      toast.error('Please fix validation errors before publishing')
      return
    }
    setIsSubmitting(true)
    try {
      const slug =
        formData.slug || slugFromTitle(formData.title) || `listing-${Date.now()}`
      const payload = {
        title: formData.title,
        tagline: formData.tagline,
        category: formData.category,
        locationCity: formData.locationCity,
        locationCountry: formData.locationCountry,
        slug,
        editorialContent: formData.editorialContent,
        gallery: ensureArray<GalleryItem>(formData.gallery),
        experience: formData.experience,
        seo: formData.seo,
        isPublished: true,
      }

      if (isNew) {
        const created = await createHostListing(payload)
        toast.success('Listing published')
        navigate(`/host/listings/${created.id}`)
      } else if (formData.id) {
        await updateHostListing(formData.id, payload)
        toast.success('Listing published')
      }
    } catch (err) {
      toast.error((err as Error).message ?? 'Failed to publish')
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, isNew, navigate, validation.isValid])

  const handleUnpublish = useCallback(async () => {
    if (!formData.id) return
    setIsSubmitting(true)
    try {
      await updateHostListing(formData.id, {
        ...formData,
        isPublished: false,
      })
      setFormData((prev) => ({ ...prev, isPublished: false }))
      toast.success('Listing unpublished')
    } catch (err) {
      toast.error((err as Error).message ?? 'Failed to unpublish')
    } finally {
      setIsSubmitting(false)
    }
  }, [formData])

  if (authLoading) return null
  if (!hasRole('host')) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Access denied.</p>
      </div>
    )
  }

  if (!isNew && isLoading && !listing) {
    return (
      <div className="flex min-h-screen">
        <Sidebar links={hostSidebarLinks} title="Host" />
        <main className="flex-1 p-8">
          <Skeleton className="h-96 rounded-xl" />
        </main>
      </div>
    )
  }

  if (!isNew && !listing && !formData.id) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-muted-foreground">Listing not found.</p>
        <Link to="/host/dashboard/listings" className="ml-4">
          <Button>Back to Listings</Button>
        </Link>
      </div>
    )
  }

  const tabErrors: Partial<Record<HostListingTabId, boolean>> = {
    basic: !!(validation.fieldErrors?.title || validation.fieldErrors?.locationCity || validation.fieldErrors?.locationCountry),
    editorial: !!validation.fieldErrors?.editorialContent,
    gallery: !!validation.fieldErrors?.gallery,
    seo: !!(validation.fieldErrors?.['seo.metaTitle'] || validation.fieldErrors?.['seo.metaDescription']),
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar links={hostSidebarLinks} title="Host" />
      <main className="flex-1 overflow-auto">
        <div className="p-8 max-w-5xl mx-auto">
          <Link
            to="/host/dashboard/listings"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Listings
          </Link>

          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="font-serif text-3xl font-bold">
                {isNew ? 'Create Listing' : 'Edit Listing'}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {isNew
                  ? 'Add a new destination to your portfolio.'
                  : `Editing ${formData.title || 'listing'}`}
              </p>
            </div>
            {!isNew && formData.id && (
              <div
                className="flex items-center gap-2 text-sm text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                {autosaveStatus === 'saving' && (
                  <span className="animate-pulse">Saving draft…</span>
                )}
                {autosaveStatus === 'saved' && (
                  <>
                    <Check className="h-4 w-4 text-green-600" aria-hidden />
                    <span>
                      Draft autosaved
                      {lastSavedAt
                        ? ` at ${new Date(lastSavedAt).toLocaleTimeString()}`
                        : ''}
                    </span>
                  </>
                )}
                {autosaveStatus === 'error' && (
                  <span className="text-destructive">Autosave failed</span>
                )}
                {autosaveStatus === 'idle' && lastSavedAt && (
                  <span>
                    Last saved {new Date(lastSavedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
            )}
          </div>

          <div className="mt-8 space-y-8">
            <MultiTabNavigator
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabErrors={tabErrors}
            />

            {validation.errors.length > 0 && (
              <ValidationSummary
                errors={validation.errors}
                fieldErrors={validation.fieldErrors}
              />
            )}

            {activeTab === 'basic' && (
              <BasicInfoTab
                data={formData}
                onChange={updateForm}
                errors={validation.fieldErrors}
              />
            )}

            {activeTab === 'editorial' && (
              <EditorialContentTab
                data={formData}
                onChange={updateForm}
                errors={validation.fieldErrors}
              />
            )}

            {activeTab === 'gallery' && (
              <GalleryUploader
                gallery={formData.gallery ?? []}
                onChange={updateGallery}
                listingId={formData.id}
                errors={validation.fieldErrors}
                disabled={isSubmitting}
              />
            )}

            {activeTab === 'experience' && (
              <ExperienceDetailsForm
                experience={formData.experience ?? INITIAL_DATA.experience}
                onChange={updateExperience}
              />
            )}

            {activeTab === 'seo' && (
              <SEOEditor
                seo={formData.seo ?? INITIAL_DATA.seo}
                slug={formData.slug}
                onSeoChange={updateSeo}
                onSlugChange={(s) => updateForm({ slug: s })}
                errors={validation.fieldErrors}
                titleHint={formData.title}
                listingId={formData.id}
              />
            )}

            <PublishControls
              isPublished={formData.isPublished ?? false}
              onSaveDraft={handleSaveDraft}
              onPreview={() => setPreviewOpen(true)}
              onPublish={handlePublish}
              onUnpublish={handleUnpublish}
              isSubmitting={isSubmitting}
              validationErrors={validation.errors}
              canPublish={!!formData.title?.trim()}
            />
          </div>
        </div>
      </main>

      <PreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        data={formData}
        listingId={formData.id}
      />
    </div>
  )
}
