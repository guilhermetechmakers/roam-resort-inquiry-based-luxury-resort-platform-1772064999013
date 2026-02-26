import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

interface StaticPageProps {
  title: string
  content: React.ReactNode
}

export function StaticPage({ title, content }: StaticPageProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-serif text-4xl font-bold">{title}</h1>
      <div className="mt-8 prose prose-lg max-w-none prose-headings:font-serif">
        {content}
      </div>
      <Link to="/" className="mt-12 inline-block">
        <Button variant="outline">Back to Home</Button>
      </Link>
    </div>
  )
}
