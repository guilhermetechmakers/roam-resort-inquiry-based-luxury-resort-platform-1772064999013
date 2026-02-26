/**
 * Admin CSV Export Service.
 * Exports inquiries and reconciliation data to CSV with configurable fields and date ranges.
 * Supports selected items or entire filtered dataset.
 */

import { shapeInquiryToAdmin, generateInquiriesCsv, generateReconciliationsCsv, downloadCsv } from '@/api/admin'
import type { Inquiry } from '@/types'
import type { AdminReconciliation } from '@/types/admin'

export interface CsvExportOptions {
  ids?: string[]
  filters?: {
    status?: string
    destination_id?: string
    host_id?: string
    guest_email?: string
    start_date?: string
    end_date?: string
  }
  fields?: string[]
  filename?: string
}

/** Export inquiries to CSV. Pass inquiries array or use options for server-side fetch. */
export function exportInquiriesToCsv(
  inquiries: Inquiry[],
  options?: { fields?: string[]; filename?: string }
): void {
  const list = Array.isArray(inquiries) ? inquiries : []
  const shaped = list.map((i) => shapeInquiryToAdmin(i))
  const csv = generateInquiriesCsv(shaped)
  const filename = options?.filename ?? `inquiries-export-${new Date().toISOString().slice(0, 10)}.csv`
  downloadCsv(csv, filename)
}

/** Export reconciliations to CSV */
export function exportReconciliationsToCsv(
  reconciliations: AdminReconciliation[],
  options?: { filename?: string }
): void {
  const list = Array.isArray(reconciliations) ? reconciliations : []
  const csv = generateReconciliationsCsv(list)
  const filename = options?.filename ?? `reconciliations-export-${new Date().toISOString().slice(0, 10)}.csv`
  downloadCsv(csv, filename)
}

/** Generate CSV string for selected inquiries (for bulk export) */
export function generateInquiriesCsvFromList(inquiries: Inquiry[]): string {
  const list = Array.isArray(inquiries) ? inquiries : []
  const shaped = list.map((i) => shapeInquiryToAdmin(i))
  return generateInquiriesCsv(shaped)
}

/** Trigger CSV download for inquiries */
export function downloadInquiriesCsv(csv: string, filename: string): void {
  downloadCsv(csv, filename)
}
