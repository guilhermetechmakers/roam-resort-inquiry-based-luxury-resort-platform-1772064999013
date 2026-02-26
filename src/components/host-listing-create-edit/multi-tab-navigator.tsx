import * as React from 'react'
import {
  FileText,
  Image,
  LayoutGrid,
  Search,
  type LucideIcon,
} from 'lucide-react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'

export type HostListingTabId =
  | 'basic'
  | 'editorial'
  | 'gallery'
  | 'experience'
  | 'seo'

interface TabConfig {
  id: HostListingTabId
  label: string
  icon: LucideIcon
  ariaLabel: string
}

const TABS: TabConfig[] = [
  { id: 'basic', label: 'Basic Info', icon: FileText, ariaLabel: 'Basic information' },
  { id: 'editorial', label: 'Editorial Content', icon: FileText, ariaLabel: 'Editorial content' },
  { id: 'gallery', label: 'Gallery', icon: Image, ariaLabel: 'Image gallery' },
  { id: 'experience', label: 'Experience Details', icon: LayoutGrid, ariaLabel: 'Experience details' },
  { id: 'seo', label: 'SEO Metadata', icon: Search, ariaLabel: 'SEO metadata' },
]

export interface MultiTabNavigatorProps {
  activeTab: HostListingTabId
  onTabChange: (tab: HostListingTabId) => void
  tabErrors?: Partial<Record<HostListingTabId, boolean>>
  className?: string
}

export function MultiTabNavigator({
  activeTab,
  onTabChange,
  tabErrors = {},
  className,
}: MultiTabNavigatorProps) {
  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'ArrowRight' && index < TABS.length - 1) {
      e.preventDefault()
      onTabChange(TABS[index + 1].id)
    } else if (e.key === 'ArrowLeft' && index > 0) {
      e.preventDefault()
      onTabChange(TABS[index - 1].id)
    }
  }

  return (
    <Tabs value={activeTab} onValueChange={(v) => onTabChange(v as HostListingTabId)}>
      <TabsList
        role="tablist"
        aria-label="Listing form sections"
        className={cn(
          'flex flex-wrap h-auto gap-1 rounded-xl border border-border bg-secondary/30 p-2',
          'transition-shadow duration-200 hover:shadow-card',
          className
        )}
      >
        {TABS.map((tab, index) => {
          const Icon = tab.icon
          const hasError = tabErrors[tab.id]
          return (
            <TabsTrigger
              key={tab.id}
              value={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-label={tab.ariaLabel}
              tabIndex={activeTab === tab.id ? 0 : -1}
              onKeyDown={(e) => handleKeyDown(e, index)}
              className={cn(
                'flex items-center gap-2 px-4 py-3 rounded-lg transition-all duration-200',
                'data-[state=active]:bg-accent data-[state=active]:text-accent-foreground data-[state=active]:shadow-md',
                'hover:bg-secondary/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                hasError && 'ring-2 ring-destructive/50'
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              <span>{tab.label}</span>
              {hasError && (
                <span className="sr-only">Has validation errors</span>
              )}
            </TabsTrigger>
          )
        })}
      </TabsList>
    </Tabs>
  )
}
