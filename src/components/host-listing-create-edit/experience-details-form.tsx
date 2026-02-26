import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import type { ListingExperience } from '@/types/host-listing-create-edit'

const AMENITY_OPTIONS = [
  'Pool', 'Spa', 'WiFi', 'Parking', 'Terrace', 'Garden', 'Fireplace',
  'Chef', 'Concierge', 'Housekeeping', 'Ski-in', 'Beach access',
  'Game drives', 'Guides', 'Dining', 'Hot tub', 'Gym',
]

const ACTIVITY_OPTIONS = [
  'Hiking', 'Skiing', 'Swimming', 'Yoga', 'Wine tasting',
  'Cooking class', 'Safari', 'Boat charter', 'Cultural tours',
  'Spa treatments', 'Stargazing', 'Cycling',
]

export interface ExperienceDetailsFormProps {
  experience: ListingExperience
  onChange: (experience: ListingExperience) => void
  errors?: Record<string, string>
  className?: string
}

export function ExperienceDetailsForm({
  experience,
  onChange,
  className,
}: ExperienceDetailsFormProps) {
  const amenities = Array.isArray(experience.amenities) ? experience.amenities : []
  const activities = Array.isArray(experience.activities) ? experience.activities : []

  const toggleAmenity = (amenity: string) => {
    const next = amenities.includes(amenity)
      ? amenities.filter((a) => a !== amenity)
      : [...amenities, amenity]
    onChange({ ...experience, amenities: next })
  }

  const toggleActivity = (activity: string) => {
    const next = activities.includes(activity)
      ? activities.filter((a) => a !== activity)
      : [...activities, activity]
    onChange({ ...experience, activities: next })
  }

  return (
    <Card className={cn('border-border shadow-card overflow-hidden', className)}>
      <CardHeader className="border-b border-border bg-secondary/20 px-8 py-6">
        <h2 className="font-serif text-xl font-semibold">Experience Details</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Capacity, amenities, accessibility, and check-in details.
        </p>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="capacity" className="text-sm font-medium">
              Guest capacity
            </Label>
            <Input
              id="capacity"
              type="number"
              min={1}
              max={50}
              value={experience.capacity ?? 4}
              onChange={(e) =>
                onChange({
                  ...experience,
                  capacity: parseInt(e.target.value, 10) || 4,
                })
              }
              className="mt-2 h-11"
            />
          </div>
          <div>
            <Label htmlFor="bedrooms" className="text-sm font-medium">
              Bedrooms
            </Label>
            <Input
              id="bedrooms"
              type="number"
              min={0}
              max={50}
              value={experience.bedrooms ?? 2}
              onChange={(e) =>
                onChange({
                  ...experience,
                  bedrooms: parseInt(e.target.value, 10) || 0,
                })
              }
              className="mt-2 h-11"
            />
          </div>
          <div>
            <Label htmlFor="beds" className="text-sm font-medium">
              Beds
            </Label>
            <Input
              id="beds"
              type="number"
              min={0}
              max={100}
              value={experience.beds ?? 2}
              onChange={(e) =>
                onChange({
                  ...experience,
                  beds: parseInt(e.target.value, 10) || 0,
                })
              }
              className="mt-2 h-11"
            />
          </div>
          <div>
            <Label htmlFor="bathrooms" className="text-sm font-medium">
              Bathrooms
            </Label>
            <Input
              id="bathrooms"
              type="number"
              min={0}
              max={50}
              value={experience.bathrooms ?? 2}
              onChange={(e) =>
                onChange({
                  ...experience,
                  bathrooms: parseInt(e.target.value, 10) || 0,
                })
              }
              className="mt-2 h-11"
            />
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Amenities</Label>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Select all that apply
          </p>
          <div className="flex flex-wrap gap-4">
            {AMENITY_OPTIONS.map((a) => (
              <label
                key={a}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Checkbox
                  checked={amenities.includes(a)}
                  onCheckedChange={() => toggleAmenity(a)}
                  aria-label={`Amenity: ${a}`}
                />
                <span className="text-sm">{a}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium">Activities</Label>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Activities available at or near the destination
          </p>
          <div className="flex flex-wrap gap-4">
            {ACTIVITY_OPTIONS.map((a) => (
              <label
                key={a}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Checkbox
                  checked={activities.includes(a)}
                  onCheckedChange={() => toggleActivity(a)}
                  aria-label={`Activity: ${a}`}
                />
                <span className="text-sm">{a}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="accessibility" className="text-sm font-medium">
            Accessibility
          </Label>
          <Textarea
            id="accessibility"
            value={experience.accessibility ?? ''}
            onChange={(e) =>
              onChange({ ...experience, accessibility: e.target.value })
            }
            placeholder="Describe accessibility features (e.g. wheelchair access, ground floor, elevator)"
            rows={3}
            className="mt-2 rounded-lg"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <Label htmlFor="checkIn" className="text-sm font-medium">
              Check-in
            </Label>
            <Input
              id="checkIn"
              value={experience.checkIn ?? ''}
              onChange={(e) =>
                onChange({ ...experience, checkIn: e.target.value })
              }
              placeholder="e.g. 3:00 PM"
              className="mt-2 h-11"
            />
          </div>
          <div>
            <Label htmlFor="checkOut" className="text-sm font-medium">
              Check-out
            </Label>
            <Input
              id="checkOut"
              value={experience.checkOut ?? ''}
              onChange={(e) =>
                onChange({ ...experience, checkOut: e.target.value })
              }
              placeholder="e.g. 11:00 AM"
              className="mt-2 h-11"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
