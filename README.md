# Roam Resort

Inquiry-first luxury resort web platform with curated editorial destination pages, authenticated guest inquiries, host listing management, and concierge-led payment workflows.

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **React Router 6** for routing
- **Tailwind CSS v3** with Roam Resort design tokens
- **Shadcn/ui** (Radix UI primitives)
- **TanStack React Query** for data fetching
- **React Hook Form** + **Zod** for forms
- **Sonner** for toasts
- **Supabase** (Auth, Database, Storage)
- **Lucide React** for icons

## Design System

- **Primary:** Deep navy (#23212A)
- **Secondary:** Warm sand beige (#ECE1D4)
- **Accent:** Bronze-gold (#A97C50)
- **Typography:** Playfair Display (headlines), Inter (body)

## Getting Started

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env` and add your Supabase credentials
3. Build: `npm run build`
4. Preview: `npm run preview`

## Project Structure

```
src/
├── components/     # UI components (shadcn, layout)
├── contexts/      # Auth context
├── data/          # Mock data
├── hooks/         # React Query hooks
├── lib/           # Supabase, API, utils
├── pages/         # Route pages
└── types/         # TypeScript types
```

## Key Flows

- **Guest:** Browse destinations → Request a Stay (auth) → Submit inquiry → Track in My Inquiries
- **Host:** Dashboard → Create/Edit listings → View related inquiries (read-only)
- **Concierge:** Admin dashboard → Manage inquiries → Create Stripe payment links → Export CSV

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
