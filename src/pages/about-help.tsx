import { Link } from 'react-router-dom'
import {
  PageLayoutShell,
  AboutHeroSection,
  BrandStoryBlock,
  FAQAccordion,
  ContactForm,
  LegalLinksRow,
} from '@/components/about-help'
import { DEFAULT_FAQS } from '@/data/about-help-data'

const BRAND_PARAGRAPHS = [
  'Roam Resort curates editorial destination experiences where storytelling meets luxury. We believe the best stays begin with a conversation—not a booking form. Our inquiry-first approach lets you share your vision, and our concierge team personalizes every detail.',
  'From handpicked properties to bespoke itineraries, we connect discerning travelers with stays that feel like home while offering the service of a five-star retreat. Whether you seek solitude, adventure, or celebration, we guide you from first inquiry to final farewell.',
]

const HERO_BACKGROUND =
  'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1920'

export function AboutHelpPage() {
  const faqItems = Array.isArray(DEFAULT_FAQS) ? DEFAULT_FAQS : []

  return (
    <PageLayoutShell
      pageMeta={{
        title: 'About & Help | Roam Resort',
        description:
          'Learn about Roam Resort, our inquiry process, and get support. Contact our concierge team for personalized assistance.',
      }}
    >
      <AboutHeroSection
        title="About Roam Resort"
        subtitle="Curated editorial destinations and high-touch stay experiences. Inquiry-first luxury."
        backgroundImage={HERO_BACKGROUND}
        ctaLabel="Request a Stay"
        ctaHref="/destinations"
        secondaryCtaLabel="Learn How to Inquire"
        secondaryCtaHref="#how-it-works"
      />

      <section id="how-it-works" className="border-t border-border bg-secondary/20 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-3xl font-semibold text-foreground sm:text-4xl text-center">
            How to Inquire
          </h2>
          <p className="mt-4 text-center text-muted-foreground max-w-2xl mx-auto">
            Browse destinations, submit your inquiry, and our concierge team will
            personalize your stay.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover">
              <span className="text-sm font-medium text-accent">Step 1</span>
              <h3 className="mt-2 font-serif text-xl font-semibold">Explore</h3>
              <p className="mt-2 text-muted-foreground">
                Browse our curated destinations and find the stay that speaks to you.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover">
              <span className="text-sm font-medium text-accent">Step 2</span>
              <h3 className="mt-2 font-serif text-xl font-semibold">Submit</h3>
              <p className="mt-2 text-muted-foreground">
                Share your dates and preferences. Our team reviews within 24–48 hours.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-card transition-all duration-300 hover:shadow-card-hover">
              <span className="text-sm font-medium text-accent">Step 3</span>
              <h3 className="mt-2 font-serif text-xl font-semibold">Confirm</h3>
              <p className="mt-2 text-muted-foreground">
                Receive a personalized offer and secure payment link to complete your stay.
              </p>
            </div>
          </div>
          <div className="mt-12 text-center">
            <Link
              to="/destinations"
              className="inline-flex items-center justify-center rounded-md bg-accent px-6 py-3 text-base font-medium text-accent-foreground shadow-accent-glow hover:bg-accent/90 hover:scale-[1.02] active:scale-[0.98] transition-transform duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Explore Destinations
            </Link>
          </div>
        </div>
      </section>

      <BrandStoryBlock
        paragraphs={BRAND_PARAGRAPHS}
        image="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800"
        imageCaption="Roam Resort — where every stay tells a story."
        imagePosition="right"
      />

      <div className="border-t border-border bg-background">
        <FAQAccordion faqs={faqItems} allowMultiple={false} />
      </div>

      <div className="border-t border-border bg-secondary/20">
        <ContactForm />
      </div>

      <footer className="border-t border-border bg-primary/5 py-8">
        <LegalLinksRow
          links={[
            { label: 'Privacy Policy', href: '/privacy' },
            { label: 'Terms of Service', href: '/terms' },
            { label: 'Cookie Policy', href: '/cookie-policy' },
          ]}
        />
      </footer>
    </PageLayoutShell>
  )
}
