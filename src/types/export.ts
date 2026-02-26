/**
 * CSV Export / Reports types for admin.
 */

export type ExportDataset = 'inquiries' | 'reconciliation' | 'both' | 'both'

export type ExportJobStatus =
  | 'queued'
  | 'processing'
  | 'complete'
  | 'failed'
  | 'cancelled'

export interface ExportFieldOption {
  id: string
  label: string
}

export interface ExportFilters {
  status?: string
  hostId?: string
  destinationId?: string
  search?: string
}

export interface ExportJob {
  id: string
  dataset: ExportDataset
  fields: string[]
  date_from: string
  date_to: string
  filters: ExportFilters
  status: ExportJobStatus
  rows_exported?: number
  error_message?: string
  download_url?: string
  storage_path?: string
  user_id: string
  created_at: string
  updated_at: string
}

export interface CreateExportPayload {
  dataset: ExportDataset
  fields: string[]
  dateFrom: string
  dateTo: string
  filters?: ExportFilters
  delimiter?: string
  includeHeaders?: boolean
}

export interface ExportDefinitions {
  datasets: Array<{ id: ExportDataset; label: string }>
  defaultMappings: Record<ExportDataset, string[]>
  exampleHeaders: Record<ExportDataset, string[]>
}

export interface HostOption {
  id: string
  name: string
  slug: string
}
