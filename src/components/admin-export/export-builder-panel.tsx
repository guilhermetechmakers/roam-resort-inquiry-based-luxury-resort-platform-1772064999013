/**
 * Export Builder: dataset, fields, date range, filters, submit.
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { FieldSelector } from './field-selector'
import { DateRangePicker } from './date-range-picker'
import { FiltersPanel } from './filters-panel'
import { ExportButton } from './export-button'
import { useExportFields, useExportHosts } from '@/hooks/use-admin-export'
import type { ExportDataset, ExportFilters } from '@/types/export'

const DATASET_OPTIONS: { value: ExportDataset; label: string }[] = [
  { value: 'inquiries', label: 'Inquiries' },
  { value: 'reconciliation', label: 'Payment Reconciliation' },
  { value: 'both', label: 'Both (Inquiries + Reconciliation)' },
]

const DELIMITER_OPTIONS = [
  { value: ',', label: 'Comma (,)' },
  { value: ';', label: 'Semicolon (;)' },
  { value: '\t', label: 'Tab' },
]

export interface ExportBuilderPanelProps {
  onSubmitExport: (config: {
    dataset: ExportDataset
    fields: string[]
    dateFrom: string
    dateTo: string
    filters: ExportFilters
    delimiter?: string
    includeHeaders?: boolean
  }) => void
  isSubmitting?: boolean
}

function getDefaultDateRange(): { from: string; to: string } {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

export function ExportBuilderPanel({
  onSubmitExport,
  isSubmitting = false,
}: ExportBuilderPanelProps) {
  const [selectedDataset, setSelectedDataset] = useState<ExportDataset>('inquiries')
  const [selectedFields, setSelectedFields] = useState<string[]>([])
  const defaultRange = getDefaultDateRange()
  const [dateFrom, setDateFrom] = useState(defaultRange.from)
  const [dateTo, setDateTo] = useState(defaultRange.to)
  const [filters, setFilters] = useState<ExportFilters>({})
  const [delimiter, setDelimiter] = useState(',')
  const [includeHeaders, setIncludeHeaders] = useState(true)

  const { data: inquiryFields = [], isLoading: inquiryFieldsLoading } =
    useExportFields(selectedDataset === 'both' ? 'inquiries' : selectedDataset)
  const { data: reconFields = [], isLoading: reconFieldsLoading } =
    useExportFields(selectedDataset === 'both' ? 'reconciliation' : null)
  const fieldOptions =
    selectedDataset === 'both'
      ? [
          ...inquiryFields.map((f) => ({
            ...f,
            id: `inquiry_${f.id}`,
            label: `[Inquiry] ${f.label}`,
          })),
          ...reconFields.map((f) => ({
            ...f,
            id: `recon_${f.id}`,
            label: `[Recon] ${f.label}`,
          })),
        ]
      : inquiryFields
  const fieldsLoading =
    selectedDataset === 'both'
      ? inquiryFieldsLoading || reconFieldsLoading
      : inquiryFieldsLoading
  const { data: hosts = [], isLoading: hostsLoading } = useExportHosts()

  useEffect(() => {
    queueMicrotask(() => setSelectedFields([]))
  }, [selectedDataset])

  const handleRangeChange = (from: string, to: string) => {
    setDateFrom(from)
    setDateTo(to)
  }

  const handleSubmit = () => {
    const from = dateFrom.trim()
    const to = dateTo.trim()
    if (!from || !to) return
    if (new Date(from) > new Date(to)) return
    if (selectedFields.length === 0) return

    onSubmitExport({
      dataset: selectedDataset,
      fields: selectedFields,
      dateFrom: from,
      dateTo: to,
      filters: filters ?? {},
      delimiter,
      includeHeaders,
    })
  }

  const isValid =
    selectedFields.length > 0 &&
    dateFrom &&
    dateTo &&
    new Date(dateFrom) <= new Date(dateTo)

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <h2 className="font-serif text-xl font-semibold">Export Builder</h2>
        <p className="text-sm text-muted-foreground">
          Choose dataset, fields, date range, and filters. Click Export CSV to create a download.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="dataset">Dataset</Label>
          <Select
            value={selectedDataset}
            onValueChange={(v) => setSelectedDataset(v as ExportDataset)}
            disabled={isSubmitting}
          >
            <SelectTrigger id="dataset" aria-label="Select dataset">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DATASET_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <FieldSelector
          options={fieldOptions}
          value={selectedFields}
          onChange={setSelectedFields}
          placeholder="Fields to export"
          disabled={fieldsLoading || isSubmitting}
        />

        <DateRangePicker
          from={dateFrom}
          to={dateTo}
          onRangeChange={handleRangeChange}
          disabled={isSubmitting}
        />

        <FiltersPanel
          hosts={hosts}
          currentFilters={filters}
          onFiltersChange={setFilters}
          disabled={hostsLoading || isSubmitting}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="delimiter">CSV Delimiter</Label>
            <Select
              value={delimiter}
              onValueChange={setDelimiter}
              disabled={isSubmitting}
            >
              <SelectTrigger id="delimiter" aria-label="Select delimiter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DELIMITER_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 pt-8">
            <Checkbox
              id="include-headers"
              checked={includeHeaders}
              onCheckedChange={(c) => setIncludeHeaders(c === true)}
              disabled={isSubmitting}
              aria-label="Include column headers"
            />
            <Label htmlFor="include-headers" className="cursor-pointer">
              Include column headers
            </Label>
          </div>
        </div>

        <div className="pt-4">
          <ExportButton
            onClick={handleSubmit}
            disabled={!isValid}
            isLoading={isSubmitting}
          />
        </div>
      </CardContent>
    </Card>
  )
}
