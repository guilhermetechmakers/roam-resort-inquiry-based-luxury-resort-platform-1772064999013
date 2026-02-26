import { useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface PageMeta {
  title?: string
  description?: string
}

export interface PageLayoutShellProps {
  children: React.ReactNode
  pageMeta?: PageMeta
  className?: string
}

export function PageLayoutShell({
  children,
  pageMeta,
  className,
}: PageLayoutShellProps) {
  const title = pageMeta?.title ?? 'About & Help | Roam Resort'
  const description =
    pageMeta?.description ??
    'Learn about Roam Resort, our inquiry process, and get support. Contact our concierge team for personalized assistance.'

  useEffect(() => {
    const prevTitle = document.title
    const metaDesc = document.querySelector('meta[name="description"]')
    const prevMeta = metaDesc?.getAttribute('content') ?? ''
    document.title = title
    if (metaDesc) metaDesc.setAttribute('content', description)
    return () => {
      document.title = prevTitle
      if (metaDesc) metaDesc.setAttribute('content', prevMeta)
    }
  }, [title, description])

  return (
    <div
      className={cn(
        'min-h-screen bg-background text-foreground',
        'font-sans antialiased',
        className
      )}
    >
      {children}
    </div>
  )
}
