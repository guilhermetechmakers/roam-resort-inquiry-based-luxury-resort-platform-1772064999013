import type { Listing, HostProfile } from '@/types'

const mockHosts: Record<string, HostProfile> = {
  'host-1': {
    id: 'host-1',
    name: 'Elena Vasquez',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    bio: 'Curator of coastal escapes. Elena has spent two decades crafting unforgettable stays across the Mediterranean and beyond.',
    editorialNote: 'All stays are inquiry-based. Our concierge will respond within 24 hours.',
  },
  'host-2': {
    id: 'host-2',
    name: 'Marcus Weber',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200',
    bio: 'Alpine specialist. Marcus brings Swiss precision and warmth to every mountain retreat he oversees.',
    editorialNote: 'Inquiry-only bookings. We tailor each stay to your preferences.',
  },
}

export const mockListings: Listing[] = [
  {
    id: '1',
    slug: 'cliffside-retreat-santorini',
    title: 'Cliffside Retreat',
    subtitle: 'Aegean serenity with endless views',
    region: 'Santorini',
    style: 'Coastal',
    status: 'live',
    hero_image_url: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=1200',
    gallery_urls: [
      'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800',
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
    ],
    editorial_content: `
## Where the Aegean Meets the Sky

Perched on the caldera's edge, Cliffside Retreat offers an intimate escape where whitewashed walls frame endless blue. Every corner is designed for contemplation—whether you're watching the sunset from your private terrace or drifting in the infinity pool.

> "A place where time slows and the horizon stretches forever." — Elena, Host

## The Experience

Our concierge team curates every detail of your stay. From private yacht excursions to candlelit dinners under the stars, we transform moments into memories. The villa sleeps eight across four suites, each with its own character and view.
    `.trim(),
    experience_details: 'Infinity pool, private terrace, concierge service, daily housekeeping',
    experienceDetails: {
      datesSuggestion: ['May–October', 'Peak: June–September'],
      guestCapacity: 8,
      amenities: ['Pool', 'Terrace', 'Concierge', 'Housekeeping', 'WiFi', 'Parking'],
      sampleItineraries: ['Sunset yacht cruise', 'Private chef dinner', 'Caldera wine tour'],
    },
    capacity: 8,
    amenities: ['Pool', 'Terrace', 'Concierge', 'Housekeeping', 'WiFi', 'Parking'],
    host_id: 'host-1',
    host: mockHosts['host-1'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    slug: 'alpine-lodge-swiss',
    title: 'Alpine Lodge',
    subtitle: 'Mountain grandeur in the Swiss Alps',
    region: 'Switzerland',
    style: 'Alpine',
    status: 'live',
    hero_image_url: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1200',
    gallery_urls: [
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
      'https://images.unsplash.com/photo-1527004013197-933c4bb611b3?w=800',
    ],
    editorial_content: `
## Above the Clouds

Nestled at 1,800 meters, Alpine Lodge commands views of snow-capped peaks and emerald valleys. The chalet blends traditional timber construction with contemporary comfort—stone fireplaces, wool throws, and floor-to-ceiling windows that bring the mountains inside.

## Winter & Summer

Ski-in access in winter; hiking and wildflower meadows in summer. Our chef prepares seasonal menus using local ingredients. The lodge accommodates twelve across six bedrooms.
    `.trim(),
    experience_details: 'Ski-in access, chef, fireplaces, spa',
    experienceDetails: {
      datesSuggestion: ['December–March (ski)', 'June–September (hiking)'],
      guestCapacity: 12,
      amenities: ['Ski', 'Spa', 'Chef', 'Fireplace', 'WiFi'],
      sampleItineraries: ['Ski-in breakfast', 'Alpine spa day', 'Mountain fondue evening'],
    },
    capacity: 12,
    amenities: ['Ski', 'Spa', 'Chef', 'Fireplace', 'WiFi'],
    host_id: 'host-2',
    host: mockHosts['host-2'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    slug: 'safari-camp-kenya',
    title: 'Safari Camp',
    subtitle: 'Untamed luxury on the savanna',
    region: 'Kenya',
    style: 'Safari',
    status: 'live',
    hero_image_url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=1200',
    gallery_urls: [
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
      'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=800',
    ],
    editorial_content: `
## Under African Skies

Wake to the call of the wild. Safari Camp sits in a private conservancy where elephants, lions, and giraffes roam. Luxurious tents feature four-poster beds, outdoor showers, and decks overlooking the waterhole.

## The Safari Experience

Daily game drives with expert guides. Sundowners in the bush. Stargazing from your deck. Our camp accommodates ten guests in five tented suites.
    `.trim(),
    experience_details: 'Game drives, expert guides, tented suites',
    experienceDetails: {
      datesSuggestion: ['July–October (Great Migration)', 'Year-round game viewing'],
      guestCapacity: 10,
      amenities: ['Game drives', 'Guides', 'Tented suites', 'Dining'],
      sampleItineraries: ['Early morning game drive', 'Bush sundowners', 'Stargazing safari'],
    },
    capacity: 10,
    amenities: ['Game drives', 'Guides', 'Tented suites', 'Dining'],
    host_id: 'host-1',
    host: mockHosts['host-1'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    slug: 'mediterranean-villa-amalfi',
    title: 'Mediterranean Villa',
    subtitle: 'Lemon groves and sea breezes on the Amalfi Coast',
    region: 'Italy',
    style: 'Coastal',
    status: 'live',
    hero_image_url: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200',
    gallery_urls: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800',
    ],
    editorial_content: 'A timeless retreat where terraced gardens meet the Tyrrhenian Sea.',
    experience_details: 'Private pool, chef, terraced gardens',
    experienceDetails: {
      datesSuggestion: ['April–October', 'Peak: May–September'],
      guestCapacity: 6,
      amenities: ['Pool', 'Chef', 'Garden', 'WiFi', 'Parking'],
      sampleItineraries: ['Lemon grove walk', 'Amalfi coast drive', 'Private boat charter'],
    },
    capacity: 6,
    amenities: ['Pool', 'Chef', 'Garden', 'WiFi', 'Parking'],
    host_id: 'host-1',
    host: mockHosts['host-1'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    slug: 'mountain-chalet-chamonix',
    title: 'Mountain Chalet',
    subtitle: 'Alpine elegance in the heart of Chamonix',
    region: 'France',
    style: 'Alpine',
    status: 'live',
    hero_image_url: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200',
    gallery_urls: [
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800',
      'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=800',
    ],
    editorial_content: 'A stone-and-timber chalet with panoramic Mont Blanc views.',
    experience_details: 'Ski-in access, hot tub, fireplace',
    experienceDetails: {
      datesSuggestion: ['December–April (ski)', 'Summer hiking'],
      guestCapacity: 8,
      amenities: ['Ski', 'Hot tub', 'Fireplace', 'WiFi'],
      sampleItineraries: ['Mont Blanc sunrise', 'Chamonix village', 'Alpine spa'],
    },
    capacity: 8,
    amenities: ['Ski', 'Hot tub', 'Fireplace', 'WiFi'],
    host_id: 'host-2',
    host: mockHosts['host-2'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5-draft',
    slug: 'mountain-chalet-draft',
    title: 'Mountain Chalet (Draft)',
    subtitle: 'Alpine elegance — work in progress',
    region: 'France',
    style: 'Alpine',
    status: 'draft',
    hero_image_url: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=1200',
    gallery_urls: [
      'https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800',
    ],
    editorial_content: 'Draft content in progress.',
    experience_details: 'Ski-in access, hot tub, fireplace',
    experienceDetails: {
      datesSuggestion: ['December–April (ski)'],
      guestCapacity: 8,
      amenities: ['Ski', 'Hot tub', 'Fireplace', 'WiFi'],
      sampleItineraries: [],
    },
    capacity: 8,
    amenities: ['Ski', 'Hot tub', 'Fireplace', 'WiFi'],
    host_id: 'host-1',
    host: mockHosts['host-1'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    slug: 'desert-oasis-morocco',
    title: 'Desert Oasis',
    subtitle: 'Berber luxury beneath the stars',
    region: 'Morocco',
    style: 'Cultural',
    status: 'live',
    hero_image_url: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=1200',
    gallery_urls: [
      'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=800',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    ],
    editorial_content: 'A kasbah-inspired retreat where ancient traditions meet modern comfort.',
    experience_details: 'Camel treks, stargazing, traditional cuisine',
    experienceDetails: {
      datesSuggestion: ['September–May', 'Avoid peak summer heat'],
      guestCapacity: 6,
      amenities: ['Pool', 'Spa', 'Dining', 'WiFi'],
      sampleItineraries: ['Desert camel trek', 'Berber dinner', 'Stargazing night'],
    },
    capacity: 6,
    amenities: ['Pool', 'Spa', 'Dining', 'WiFi'],
    host_id: 'host-1',
    host: mockHosts['host-1'],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]
