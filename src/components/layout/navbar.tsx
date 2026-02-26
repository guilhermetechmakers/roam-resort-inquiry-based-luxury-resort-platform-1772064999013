import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/contexts/auth-context'

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/destinations', label: 'Destinations' },
  { to: '/contact', label: 'Contact' },
]

export function Navbar({ transparent = false }: { transparent?: boolean }) {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const { isAuthenticated, signOut, hasRole } = useAuth()
  const isScrolled = !transparent

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled && 'bg-background/95 backdrop-blur-sm border-b border-border shadow-sm'
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className={cn(
            'font-serif text-xl font-semibold',
            transparent ? 'text-primary-foreground hover:text-primary-foreground/90' : 'text-foreground'
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
                transparent
                  ? 'text-primary-foreground/90 hover:text-primary-foreground'
                  : location.pathname === to
                    ? 'text-accent'
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
                transparent && 'text-primary-foreground'
              )}
            >
              <Link to="/profile">
                <Button
                  variant="ghost"
                  size="sm"
                  className={transparent ? 'text-primary-foreground/90 hover:bg-white/10 hover:text-primary-foreground' : ''}
                >
                  My Inquiries
                </Button>
              </Link>
              <Link to="/settings">
                <Button
                  variant="ghost"
                  size="sm"
                  className={transparent ? 'text-primary-foreground/90 hover:bg-white/10 hover:text-primary-foreground' : ''}
                >
                  Settings
                </Button>
              </Link>
              {hasRole('host') && (
                <Link to="/host">
                  <Button
                    variant="outline"
                    size="sm"
                    className={transparent ? 'border-white/50 text-primary-foreground hover:bg-white/10' : ''}
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
                    className={transparent ? 'border-white/50 text-primary-foreground hover:bg-white/10' : ''}
                  >
                    Admin
                  </Button>
                </Link>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className={transparent ? 'text-primary-foreground/90 hover:bg-white/10 hover:text-primary-foreground' : ''}
              >
                Sign Out
              </Button>
            </div>
          ) : (
            <Link to="/login">
              <Button
                size="sm"
                className={transparent ? 'border-white/50 bg-white/10 text-primary-foreground hover:bg-white/20' : ''}
              >
                Request a Stay
              </Button>
            </Link>
          )}
        </div>

        <button
          type="button"
          className={cn(
            'md:hidden rounded-md p-2 hover:bg-secondary',
            transparent && 'text-primary-foreground hover:bg-white/10'
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
              <Link to="/login" onClick={() => setOpen(false)}>
                <Button className="w-full">Request a Stay</Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
