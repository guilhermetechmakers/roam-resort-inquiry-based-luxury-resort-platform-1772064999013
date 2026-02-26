/**
 * Secure CSV download link with expiry handling.
 */

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CSVDownloadLinkProps {
  url: string | null
  filename?: string
  exportId?: string
  onFetchUrl?: (exportId: string) => Promise<string | null>
  disabled?: boolean
  className?: string
}

export function CSVDownloadLink({
  url,
  filename,
  exportId,
  onFetchUrl,
  disabled = false,
  className,
}: CSVDownloadLinkProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)

  const handleClick = async () => {
    let downloadUrl = url
    if (!downloadUrl && exportId && onFetchUrl) {
      setLoading(true)
      setError(false)
      try {
        downloadUrl = await onFetchUrl(exportId)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }

    if (!downloadUrl) {
      setError(true)
      return
    }

    try {
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename ?? `export-${new Date().toISOString().slice(0, 10)}.csv`
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch {
      setError(true)
    }
  }

  if (error) {
    return (
      <span className="text-sm text-destructive" role="status">
        Download unavailable
      </span>
    )
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleClick}
      disabled={disabled || loading || (!url && !exportId)}
      aria-busy={loading}
      aria-label="Download CSV"
      className={cn('gap-1.5', className)}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden />
      ) : (
        <Download className="h-4 w-4" aria-hidden />
      )}
      Download
    </Button>
  )
}
