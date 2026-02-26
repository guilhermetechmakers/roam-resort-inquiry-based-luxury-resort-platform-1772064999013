import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { HostListingFormData } from '@/types/host-listing-create-edit'

const CATEGORY_OPTIONS = ['Coastal', 'Alpine', 'Safari', 'Cultural', 'Urban', 'Rural']
const COUNTRY_OPTIONS = [
  'Greece', 'Switzerland', 'Kenya', 'Italy', 'France', 'Morocco',
  'Spain', 'Portugal', 'Croatia', 'Japan', 'Thailand', 'USA', 'Other',
]

export interface BasicInfoTabProps {
  data: HostListingFormData
  onChange: (updates: Partial<HostListingFormData>) => void
  errors?: Record<string, string>
  className?: string
}

export function BasicInfoTab({
  data,
  onChange,
  errors = {},
  className,
}: BasicInfoTabProps) {
  const update = (key: keyof HostListingFormData, value: unknown) => {
    onChange({ [key]: value })
  }

  return (
    <Card className={cn('border-border shadow-card overflow-hidden', className)}>
      <CardHeader className="border-b border-border bg-secondary/20 px-8 py-6">
        <h2 className="font-serif text-xl font-semibold">Basic Information</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Title, location, and category for your destination listing.
        </p>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              value={data.title ?? ''}
              onChange={(e) => update('title', e.target.value)}
              placeholder="e.g. Cliffside Retreat"
              className="mt-2 h-11 rounded-lg border-border focus:ring-2 focus:ring-accent/30"
              aria-invalid={!!errors.title}
              aria-describedby={errors.title ? 'title-error' : undefined}
            />
            {errors.title && (
              <p id="title-error" className="mt-1 text-sm text-destructive" role="alert">
                {errors.title}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground">
              5–100 characters. Keep it memorable and descriptive.
            </p>
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="tagline" className="text-sm font-medium">
              Tagline
            </Label>
            <Input
              id="tagline"
              value={data.tagline ?? ''}
              onChange={(e) => update('tagline', e.target.value)}
              placeholder="e.g. Aegean serenity with endless views"
              className="mt-2 h-11 rounded-lg border-border"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              A short phrase that captures the essence of your destination.
            </p>
          </div>

          <div>
            <Label htmlFor="category" className="text-sm font-medium">
              Destination Category <span className="text-destructive">*</span>
            </Label>
            <Select
              value={data.category ?? ''}
              onValueChange={(v) => update('category', v)}
            >
              <SelectTrigger
                id="category"
                className="mt-2 h-11 rounded-lg"
                aria-invalid={!!errors.category}
              >
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.category && (
              <p className="mt-1 text-sm text-destructive" role="alert">
                {errors.category}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="locationCity" className="text-sm font-medium">
              City / Region <span className="text-destructive">*</span>
            </Label>
            <Input
              id="locationCity"
              value={data.locationCity ?? ''}
              onChange={(e) => update('locationCity', e.target.value)}
              placeholder="e.g. Santorini"
              className="mt-2 h-11 rounded-lg"
              aria-invalid={!!errors.locationCity}
            />
            {errors.locationCity && (
              <p className="mt-1 text-sm text-destructive" role="alert">
                {errors.locationCity}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="locationCountry" className="text-sm font-medium">
              Country <span className="text-destructive">*</span>
            </Label>
            <Select
              value={data.locationCountry ?? ''}
              onValueChange={(v) => update('locationCountry', v)}
            >
              <SelectTrigger
                id="locationCountry"
                className="mt-2 h-11 rounded-lg"
                aria-invalid={!!errors.locationCountry}
              >
                <SelectValue placeholder="Select country" />
              </SelectTrigger>
              <SelectContent>
                {COUNTRY_OPTIONS.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.locationCountry && (
              <p className="mt-1 text-sm text-destructive" role="alert">
                {errors.locationCountry}
              </p>
            )}
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="mapEmbed" className="text-sm font-medium">
              Map Embed (optional)
            </Label>
            <Input
              id="mapEmbed"
              value={data.mapEmbed ?? ''}
              onChange={(e) => update('mapEmbed', e.target.value)}
              placeholder="Google Maps embed URL or iframe src"
              className="mt-2 h-11 rounded-lg"
            />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="coordinates" className="text-sm font-medium">
              Coordinates (optional)
            </Label>
            <Input
              id="coordinates"
              value={data.coordinates ?? ''}
              onChange={(e) => update('coordinates', e.target.value)}
              placeholder="e.g. 36.3932, 25.4615"
              className="mt-2 h-11 rounded-lg"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
