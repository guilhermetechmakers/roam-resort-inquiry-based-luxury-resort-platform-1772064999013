import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/use-auth'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/destinations', label: 'Destinations' },
  { to: '/about-help', label: 'About & Help' },
  { to: '/contact', label: 'Contact' },
]

const SCROLL_THRESHOLD = 24

export function Navbar({ transparent = false }: { transparent?: boolean }) {
  const [open, setOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(!transparent)
  const location = useLocation()
  const { isAuthenticated, signOut, hasRole } = useAuth()

  useEffect(() => {
    if (!transparent) return
    const handleScroll = () => {
      setIsScrolled(window.scrollY > SCROLL_THRESHOLD)
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [transparent])

  const overHero = transparent && !isScrolled

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        overHero
          ? 'bg-primary border-b border-primary-foreground/20 shadow-md'
          : isScrolled && 'bg-background/95 backdrop-blur-sm border-b border-border shadow-sm'
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className={cn(
            'font-serif text-xl font-semibold transition-colors',
            overHero ? 'text-primary-foreground hover:text-primary-foreground/90' : 'text-foreground'
          )}
        >
          Roam Resort
        </Link>

        <div className="hidden md:flex md:items-center md:gap-8">
          {navLinks.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'text-sm font-medium transition-colors',
                overHero
                  ? 'text-primary-foreground/90 hover:text-primary-foreground'
                  : location.pathname === to
                    ? 'text-accent border-b-2 border-accent'
                    : 'text-foreground hover:text-accent'
              )}
            >
              {label}
            </Link>
          ))}
          {isAuthenticated ? (
            <div
              className={cn(
                'flex items-center gap-4',
                overHero && 'text-primary-foreground'
              )}
            >
              <Link to="/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className={overHero ? 'text-primary-foreground/90 hover:bg-white/10 hover:text-primary-foreground' : ''}
                >
                  My Inquiries
                </Button>
              </Link>
              <Link to="/settings">
                <Button
                  variant="ghost"
                  size="sm"
                  className={overHero ? 'text-primary-foreground/90 hover:bg-white/10 hover:text-primary-foreground' : ''}
                >
                  Settings
                </Button>
              </Link>
              {hasRole('host') && (
                <Link to="/host">
                  <Button
                    variant="outline"
                    size="sm"
                    className={overHero ? 'border-white/50 text-primary-foreground hover:bg-white/10' : ''}
                  >
                    Host Dashboard
                  </Button>
                </Link>
              )}
              {hasRole('concierge') && (
                <Link to="/admin">
                  <Button
                    variant="outline"
                    size="sm"
                    className={overHero ? 'border-white/50 text-primary-foreground hover:bg-white/10' : ''}
                  >
                    Admin
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className={overHero ? 'text-primary-foreground/90 hover:bg-white/10 hover:text-primary-foreground' : ''}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link
                to="/login?redirect=%2Fhost%2Fdashboard%2Flistings"
                className={cn(
                  'text-sm font-medium',
                  overHero
                    ? 'text-primary-foreground/90 hover:text-primary-foreground'
                    : 'text-foreground hover:text-accent'
                )}
              >
                Host Login
              </Link>
              <Link to="/login">
                <Button
                  size="sm"
                  className={overHero ? 'border-white/50 bg-white/10 text-primary-foreground hover:bg-white/20' : 'bg-accent text-accent-foreground hover:bg-accent/90'}
                >
                  Request a Stay
                </Button>
              </Link>
            </div>
          )}
        </div>

        <button
          type="button"
          className={cn(
            'md:hidden rounded-md p-2 hover:bg-secondary',
            overHero && 'text-primary-foreground hover:bg-white/10'
          )}
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {open && (
        <div className="md:hidden border-t border-border bg-card px-4 py-4 animate-fade-in">
          <div className="flex flex-col gap-2">
            {navLinks.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="block py-2 text-sm font-medium"
                onClick={() => setOpen(false)}
              >
                {label}
              </Link>
            ))}
            {isAuthenticated ? (
              <>
                <Link to="/profile" onClick={() => setOpen(false)} className="py-2">
                  My Inquiries
                </Link>
                <Link to="/settings" onClick={() => setOpen(false)} className="py-2">
                  Settings
                </Link>
                {hasRole('host') && (
                  <Link to="/host" onClick={() => setOpen(false)} className="py-2">
                    Host Dashboard
                  </Link>
                )}
                {hasRole('concierge') && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="py-2">
                    Admin
                  </Link>
                )}
                <button type="button" onClick={() => { signOut(); setOpen(false); }} className="py-2 text-left">
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login?redirect=%2Fhost%2Fdashboard%2Flistings"
                  onClick={() => setOpen(false)}
                  className="py-2 text-sm font-medium"
                >
                  Host Login
                </Link>
                <Link to="/login" onClick={() => setOpen(false)}>
                  <Button className="w-full">Request a Stay</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
