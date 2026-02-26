import type { EditorialBlock, EditorialTeaser } from '@/types'

export const mockEditorialBlocks: EditorialBlock[] = [
  {
    id: '1',
    title: 'A Host\'s Story: Finding Serenity in Santorini',
    teaser: 'Our host Maria shares how a decade of travel led her to create Cliffside Retreat—a place where the Aegean meets the sky and every sunset feels like the first.',
    imageUrl: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800',
    link: '/destinations/cliffside-retreat-santorini',
    priority: 1,
  },
]

export const mockEditorialTeasers: EditorialTeaser[] = [
  {
    id: '1',
    title: 'Where the Aegean Meets the Sky',
    excerpt: 'Perched on the caldera\'s edge, Cliffside Retreat offers an intimate escape where whitewashed walls frame endless blue.',
    imageUrl: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=800',
    destinationSlug: 'cliffside-retreat-santorini',
  },
  {
    id: '2',
    title: 'Above the Clouds',
    excerpt: 'Nestled at 1,800 meters, Alpine Lodge commands views of snow-capped peaks and emerald valleys.',
    imageUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800',
    destinationSlug: 'alpine-lodge-swiss',
  },
  {
    id: '3',
    title: 'Under African Skies',
    excerpt: 'Wake to the call of the wild. Safari Camp sits in a private conservancy where elephants and lions roam.',
    imageUrl: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800',
    destinationSlug: 'safari-camp-kenya',
  },
  {
    id: '4',
    title: 'Lemon Groves and Sea Breezes',
    excerpt: 'A timeless retreat where terraced gardens meet the Tyrrhenian Sea on the Amalfi Coast.',
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800',
    destinationSlug: 'mediterranean-villa-amalfi',
  },
]
