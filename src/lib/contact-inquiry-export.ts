/**
 * CSV export for contact inquiries.
 * Safe handling of null/undefined values.
 */

import type { ContactInquiry } from '@/types/contact-inquiry'

function escapeCsvCell(value: unknown): string {
  if (value == null) return ''
  const s = String(value)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

function formatDate(d: string | null | undefined): string {
  if (!d) return ''
  try {
    return new Date(d).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  } catch {
    return String(d)
  }
}

export function shapeContactInquiryForCsv(i: ContactInquiry): Record<string, string> {
  const dest = i.destination
  const destName = typeof dest === 'object' && dest ? (dest.title ?? dest.slug ?? '') : ''
  return {
    id: i.id ?? '',
    reference: i.inquiry_reference ?? '',
    name: i.name ?? '',
    email: i.email ?? '',
    subject: i.subject ?? '',
    message: (i.message ?? '').slice(0, 500),
    destination: destName,
    start_date: formatDate(i.start_date),
    end_date: formatDate(i.end_date),
    guests: String(i.guests ?? ''),
    is_concierge: i.is_concierge ? 'Yes' : 'No',
    preferred_contact_method: i.preferred_contact_method ?? '',
    status: i.status ?? '',
    internal_notes: (i.internal_notes ?? '').slice(0, 500),
    created_at: i.created_at ?? '',
    updated_at: i.updated_at ?? '',
  }
}

export function generateContactInquiriesCsv(inquiries: ContactInquiry[]): string {
  const list = Array.isArray(inquiries) ? inquiries : []
  if (list.length === 0) {
    return 'id,reference,name,email,subject,message,destination,start_date,end_date,guests,is_concierge,preferred_contact_method,status,internal_notes,created_at,updated_at\n'
  }

  const headers = Object.keys(shapeContactInquiryForCsv(list[0]!))
  const headerRow = headers.map(escapeCsvCell).join(',')

  const rows = list.map((i) => {
    const row = shapeContactInquiryForCsv(i)
    return headers.map((h) => escapeCsvCell(row[h])).join(',')
  })

  return [headerRow, ...rows].join('\n')
}

export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
