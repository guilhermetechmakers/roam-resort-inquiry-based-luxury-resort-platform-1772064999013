import { useEffect, useRef, useCallback } from 'react'

export interface DraftAutoSaverOptions<T> {
  /** Form/draft state to persist */
  data: T
  /** Callback to persist (e.g. localStorage, API) */
  onSave: (data: T) => void | Promise<void>
  /** Debounce delay in ms (default 60000 = 1 min) */
  delay?: number
  /** Only save when data has changed from initial */
  enabled?: boolean
}

/**
 * Debounced autosave hook. Persists data after delay when data changes.
 * Respects enabled flag and avoids saving identical data.
 */
export function useDraftAutoSave<T>({
  data,
  onSave,
  delay = 60_000,
  enabled = true,
}: DraftAutoSaverOptions<T>) {
  const prevRef = useRef<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const save = useCallback(async () => {
    if (!enabled) return
    const serialized = JSON.stringify(data)
    if (prevRef.current === serialized) return
    prevRef.current = serialized
    try {
      await onSave(data)
    } catch {
      prevRef.current = null
    }
  }, [data, onSave, enabled])

  useEffect(() => {
    if (!enabled) return

    timerRef.current = setTimeout(() => {
      save()
      timerRef.current = null
    }, delay)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
        timerRef.current = null
      }
    }
  }, [data, delay, enabled, save])

  return { save }
}
