import { Link } from 'react-router-dom'
import { cn } from '@/lib/utils'

export interface FooterLink {
  label: string
  href: string
}

export interface SocialLink {
  label: string
  href: string
  icon?: React.ReactNode
}

export interface FooterBarProps {
  links?: FooterLink[]
  socialLinks?: SocialLink[]
  className?: string
}

const DEFAULT_LINKS: FooterLink[] = [
  { label: 'Destinations', href: '/destinations' },
  { label: 'Contact', href: '/contact' },
  { label: 'Terms', href: '/terms' },
  { label: 'Privacy', href: '/privacy' },
  { label: 'Cookies', href: '/cookie-policy' },
]

export function FooterBar({
  links = DEFAULT_LINKS,
  socialLinks = [],
  className,
}: FooterBarProps) {
  const linkList = Array.isArray(links) ? links : DEFAULT_LINKS
  const socialList = Array.isArray(socialLinks) ? socialLinks : []

  return (
    <footer
      className={cn(
        'border-t border-border bg-primary text-primary-foreground',
        className
      )}
      role="contentinfo"
    >
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
            <h4 className="text-sm font-semibold uppercase tracking-wider">
              Explore
            </h4>
            <ul className="mt-4 space-y-2">
              {linkList.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    to={href}
                    className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wider">
              Support
            </h4>
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
        {socialList.length > 0 && (
          <div className="mt-8 flex gap-4">
            {socialList.map((s) => (
              <a
                key={s.href}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-foreground/80 hover:text-primary-foreground transition-colors"
                aria-label={s.label}
              >
                {s.icon ?? s.label}
              </a>
            ))}
          </div>
        )}
        <div className="mt-12 border-t border-primary-foreground/20 pt-8 text-center text-sm text-primary-foreground/60">
          © {new Date().getFullYear()} Roam Resort. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
