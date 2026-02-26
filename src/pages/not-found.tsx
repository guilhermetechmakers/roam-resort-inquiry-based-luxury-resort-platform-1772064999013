import { Link } from 'react-router-dom'
import { Home, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <h1 className="font-serif text-6xl font-bold text-muted-foreground">404</h1>
      <h2 className="mt-4 font-serif text-2xl font-semibold">Page not found</h2>
      <p className="mt-2 text-center text-muted-foreground max-w-md">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div className="mt-8 flex gap-4">
        <Link to="/">
          <Button>
            <Home className="mr-2 h-5 w-5" />
            Home
          </Button>
        </Link>
        <Link to="/destinations">
          <Button variant="outline">
            <Search className="mr-2 h-5 w-5" />
            Browse Destinations
          </Button>
        </Link>
      </div>
    </div>
  )
}
