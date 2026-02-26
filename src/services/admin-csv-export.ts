/**
 * Admin CSV Export Service
 * Exports inquiries and reconciliation data to CSV with configurable fields and date ranges.
 * Supports exporting selected items or the entire filtered dataset.
 */

import {
  shapeInquiryToAdmin,
  generateInquiriesCsv,
  generateReconciliationsCsv,
  downloadCsv,
  fetchAdminInquiries,
  fetchAdminReconciliations,
} from '@/api/admin'
import type { Inquiry } from '@/types'
import type { AdminInquiryFilters } from '@/api/admin'
import type { AdminReconciliation } from '@/types/admin'

export const DEFAULT_INQUIRY_FIELDS = [
  'Reference',
  'Guest Name',
  'Destination',
  'Check-in',
  'Check-out',
  'Guests',
  'Status',
  'Payment Status',
  'Amount',
  'Currency',
  'Created',
] as const

export interface ExportInquiriesOptions {
  inquiries?: Inquiry[]
  filters?: AdminInquiryFilters
  fields?: string[]
  filename?: string
}

/**
 * Export inquiries to CSV. Uses provided inquiries or fetches by filters.
 */
export async function exportInquiriesToCsv(options: ExportInquiriesOptions = {}): Promise<string> {
  const { inquiries, filters, filename } = options
  let list: Inquiry[] = []

  if (Array.isArray(inquiries) && inquiries.length > 0) {
    list = inquiries
  } else if (filters) {
    const result = await fetchAdminInquiries({
      ...filters,
      page: 1,
      pageSize: 1000,
    })
    list = result?.data ?? []
  }

  const shaped = (list ?? []).map((i) => shapeInquiryToAdmin(i))
  const csv = generateInquiriesCsv(shaped)

  if (filename) {
    downloadCsv(csv, filename)
  }

  return csv
}

export interface ExportReconciliationsOptions {
  dateFrom?: string
  dateTo?: string
  filename?: string
}

/**
 * Export reconciliation data to CSV.
 */
export async function exportReconciliationsToCsv(
  options: ExportReconciliationsOptions = {}
): Promise<string> {
  const { dateFrom, dateTo, filename } = options
  const { data } = await fetchAdminReconciliations({
    dateFrom,
    dateTo,
  })
  const list = data ?? []
  const csv = generateReconciliationsCsv(list as AdminReconciliation[])

  if (filename) {
    downloadCsv(csv, filename)
  }

  return csv
}

/**
 * Trigger CSV download for inquiries.
 */
export function downloadInquiriesCsv(
  inquiries: Inquiry[],
  filename = `inquiries-export-${new Date().toISOString().slice(0, 10)}.csv`
): void {
  const shaped = (inquiries ?? []).map((i) => shapeInquiryToAdmin(i))
  const csv = generateInquiriesCsv(shaped)
  downloadCsv(csv, filename)
}
