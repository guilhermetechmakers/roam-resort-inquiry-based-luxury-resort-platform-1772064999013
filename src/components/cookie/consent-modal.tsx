import { useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CookieCategoryCard } from '@/components/cookie/cookie-category-card'
import { cn } from '@/lib/utils'
import type { CookieCategory } from '@/types/cookie'

export interface ConsentModalProps {
  open: boolean
  onClose: () => void
  onSave: (preferences: Record<string, boolean>) => void
  categories: CookieCategory[]
  preferences: Record<string, boolean>
  onPreferenceChange: (categoryId: string, enabled: boolean) => void
  className?: string
}

export function ConsentModal({
  open,
  onClose,
  onSave,
  categories,
  preferences,
  onPreferenceChange,
  className,
}: ConsentModalProps) {
  const safeCategories = Array.isArray(categories) ? categories : []

  const handleSave = () => {
    const validKeys = safeCategories.map((c) => c?.id).filter(Boolean) as string[]
    const toSave: Record<string, boolean> = {}
    for (const key of validKeys) {
      toSave[key] = preferences[key] === true
    }
    onSave(toSave)
    onClose()
  }

  const handleAcceptAll = () => {
    const all: Record<string, boolean> = {}
    for (const cat of safeCategories) {
      const id = cat?.id
      if (id) all[id] = true
    }
    onSave(all)
    onClose()
  }

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent
        className={cn('max-w-2xl max-h-[90vh] overflow-y-auto', className)}
        aria-modal="true"
        role="dialog"
        aria-labelledby="consent-modal-title"
        aria-describedby="consent-modal-desc"
      >
        <DialogHeader>
          <DialogTitle id="consent-modal-title"
            className="font-serif text-2xl font-semibold"
          >
            Cookie Preferences
          </DialogTitle>
          <DialogDescription id="consent-modal-desc">
            Choose which cookies you allow. Essential cookies are required for the site to function
            and cannot be disabled.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {safeCategories.map((category, idx) => {
            const cat = category ?? { id: 'essential', name: '', description: '', required: true }
            const enabled = cat.required ? true : (preferences[cat.id] === true)
            return (
              <CookieCategoryCard
                key={cat.id ?? `cat-${idx}`}
                category={cat}
                enabled={enabled}
                onToggle={onPreferenceChange}
              />
            )
          })}
        </div>

        <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-3">
          <Button variant="outline" onClick={onClose} className="min-w-[120px]">
            Cancel
          </Button>
          <Button variant="secondary" onClick={handleAcceptAll} className="min-w-[120px]">
            Accept All
          </Button>
          <Button onClick={handleSave} className="min-w-[140px]">
            Save Preferences
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
