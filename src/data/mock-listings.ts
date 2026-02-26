import type { Listing } from '@/types'

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

## The Experience

Our concierge team curates every detail of your stay. From private yacht excursions to candlelit dinners under the stars, we transform moments into memories. The villa sleeps eight across four suites, each with its own character and view.
    `.trim(),
    experience_details: 'Infinity pool, private terrace, concierge service, daily housekeeping',
    capacity: 8,
    amenities: ['Pool', 'Terrace', 'Concierge', 'Housekeeping', 'WiFi', 'Parking'],
    host_id: 'host-1',
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
    capacity: 12,
    amenities: ['Ski', 'Spa', 'Chef', 'Fireplace', 'WiFi'],
    host_id: 'host-2',
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
    capacity: 10,
    amenities: ['Game drives', 'Guides', 'Tented suites', 'Dining'],
    host_id: 'host-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]
