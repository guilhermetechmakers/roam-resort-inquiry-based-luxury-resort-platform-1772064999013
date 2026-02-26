import { useState, useCallback, useEffect } from 'react'
import { Bell, Mail, Megaphone, Clock, Shield, BarChart3 } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { HelpTooltip } from './help-tooltip'
import type { SettingsUserProfile } from '@/types/settings'

export interface NotificationPreferencesProps {
  profile: SettingsUserProfile | null | undefined
  onSave: (prefs: {
    inquiryUpdates: boolean
    marketing: boolean
    reminders: boolean
    dataSharingOptOut?: boolean
    adPersonalizationOptOut?: boolean
  }) => Promise<void>
  isSaving?: boolean
}

export function NotificationPreferences({
  profile,
  onSave,
  isSaving = false,
}: NotificationPreferencesProps) {
  const notifs = profile?.preferences?.notifications ?? {}
  const privacy = (profile?.preferences as { dataSharingOptOut?: boolean; adPersonalizationOptOut?: boolean } | undefined) ?? {}
  const [inquiryUpdates, setInquiryUpdates] = useState(notifs.inquiryUpdates ?? true)
  const [marketing, setMarketing] = useState(notifs.marketing ?? false)
  const [reminders, setReminders] = useState(notifs.reminders ?? true)
  const [dataSharingOptOut, setDataSharingOptOut] = useState(privacy.dataSharingOptOut ?? false)
  const [adPersonalizationOptOut, setAdPersonalizationOptOut] = useState(privacy.adPersonalizationOptOut ?? false)
  const [hasChanges, setHasChanges] = useState(false)

  // Sync local state when profile loads or updates (e.g. after save)
  useEffect(() => {
    const n = profile?.preferences?.notifications ?? {}
    const p = (profile?.preferences as { dataSharingOptOut?: boolean; adPersonalizationOptOut?: boolean } | undefined) ?? {}
    /* eslint-disable react-hooks/set-state-in-effect -- sync from server when profile changes */
    setInquiryUpdates(n.inquiryUpdates ?? true)
    setMarketing(n.marketing ?? false)
    setReminders(n.reminders ?? true)
    setDataSharingOptOut(p.dataSharingOptOut ?? false)
    setAdPersonalizationOptOut(p.adPersonalizationOptOut ?? false)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [profile?.preferences])

  const handleToggle = useCallback(
    (key: 'inquiryUpdates' | 'marketing' | 'reminders' | 'dataSharingOptOut' | 'adPersonalizationOptOut', value: boolean) => {
      if (key === 'inquiryUpdates') setInquiryUpdates(value)
      if (key === 'marketing') setMarketing(value)
      if (key === 'reminders') setReminders(value)
      if (key === 'dataSharingOptOut') setDataSharingOptOut(value)
      if (key === 'adPersonalizationOptOut') setAdPersonalizationOptOut(value)
      setHasChanges(true)
    },
    []
  )

  const handleSave = useCallback(async () => {
    await onSave({
      inquiryUpdates,
      marketing,
      reminders,
      dataSharingOptOut,
      adPersonalizationOptOut,
    })
    setHasChanges(false)
  }, [inquiryUpdates, marketing, reminders, dataSharingOptOut, adPersonalizationOptOut, onSave])

  return (
    <Card className="overflow-hidden transition-all duration-300 hover:shadow-card-hover">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-accent" />
            <h3 className="font-serif text-xl font-semibold">Notification Preferences</h3>
            <HelpTooltip
              content="Control how we contact you. Inquiry updates include status changes and payment links."
            />
          </div>
          {hasChanges && (
            <Button
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-accent hover:bg-accent/90"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Choose which emails you want to receive
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label htmlFor="inquiry-updates" className="font-medium">
                Inquiry updates
              </Label>
              <p className="text-sm text-muted-foreground">
                Status changes, payment links, and concierge messages
              </p>
            </div>
          </div>
          <Switch
            id="inquiry-updates"
            checked={inquiryUpdates}
            onCheckedChange={(v) => handleToggle('inquiryUpdates', v)}
            aria-label="Inquiry updates email"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-3">
            <Megaphone className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label htmlFor="marketing" className="font-medium">
                Marketing communications
              </Label>
              <p className="text-sm text-muted-foreground">
                Offers, new destinations, and editorial content
              </p>
            </div>
          </div>
          <Switch
            id="marketing"
            checked={marketing}
            onCheckedChange={(v) => handleToggle('marketing', v)}
            aria-label="Marketing opt-in"
          />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <div>
              <Label htmlFor="reminders" className="font-medium">
                Reminders
              </Label>
              <p className="text-sm text-muted-foreground">
                Booking reminders and follow-up emails
              </p>
            </div>
          </div>
          <Switch
            id="reminders"
            checked={reminders}
            onCheckedChange={(v) => handleToggle('reminders', v)}
            aria-label="Reminders email"
          />
        </div>

        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs uppercase tracking-wide text-muted-foreground mb-4">Privacy controls</p>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="data-sharing" className="font-medium">
                    Data sharing opt-out
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Opt out of sharing your data with trusted partners
                  </p>
                </div>
              </div>
              <Switch
                id="data-sharing"
                checked={dataSharingOptOut}
                onCheckedChange={(v) => handleToggle('dataSharingOptOut', v)}
                aria-label="Data sharing opt-out"
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label htmlFor="ad-personalization" className="font-medium">
                    Ad personalization opt-out
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Disable personalized advertising based on your activity
                  </p>
                </div>
              </div>
              <Switch
                id="ad-personalization"
                checked={adPersonalizationOptOut}
                onCheckedChange={(v) => handleToggle('adPersonalizationOptOut', v)}
                aria-label="Ad personalization opt-out"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
