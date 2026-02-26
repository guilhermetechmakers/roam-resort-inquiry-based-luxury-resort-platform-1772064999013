import { Link } from 'react-router-dom'
import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function ErrorPage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center px-4">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>
      <h1 className="mt-6 font-serif text-3xl font-bold">Something went wrong</h1>
      <p className="mt-2 text-center text-muted-foreground max-w-md">
        We're sorry. An unexpected error occurred. Please try again later.
      </p>
      <Link to="/" className="mt-8">
        <Button>Return Home</Button>
      </Link>
    </div>
  )
}
