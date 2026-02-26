import { Link } from 'react-router-dom'

const footerLinks = [
  { to: '/destinations', label: 'Destinations' },
  { to: '/contact', label: 'Contact' },
  { to: '/terms', label: 'Terms' },
  { to: '/privacy', label: 'Privacy' },
  { to: '/cookie-policy', label: 'Cookies' },
]

export function Footer() {
  return (
    <footer className="border-t border-border bg-primary text-primary-foreground">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <h3 className="font-serif text-2xl font-semibold">Roam Resort</h3>
            <p className="mt-4 max-w-md text-sm text-primary-foreground/80">
              Curated editorial destinations and high-touch stay experiences.
              Inquiry-first luxury resort platform.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider">Explore</h4>
            <ul className="mt-4 space-y-2">
              {footerLinks.map(({ to, label }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider">Support</h4>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  to="/contact"
                  className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  Contact Us
                </Link>
              </li>
              <li>
                <Link
                  to="/about-help"
                  className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                >
                  About & Help
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t border-primary-foreground/20 pt-8 text-center text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} Roam Resort. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
